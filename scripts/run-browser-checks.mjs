// One native test entrypoint: every current browser verifier is mandatory.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { isAbsolute, resolve } from 'node:path';

const testPython = process.env.SITE_TEST_PYTHON || '/usr/bin/python3';
assert.ok(isAbsolute(testPython), 'SITE_TEST_PYTHON must be an absolute interpreter path');

const port = await new Promise((resolvePort, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const address = probe.address();
    probe.close(error => error ? reject(error) : resolvePort(address.port));
  });
});
const base = `http://127.0.0.1:${port}`;
const server = spawn('/usr/bin/python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', resolve('dist')], { stdio: 'ignore' });
let serverError;
server.once('error', error => { serverError = error; });
const serverExit = new Promise(resolveExit => {
  server.once('exit', resolveExit);
  server.once('error', resolveExit);
});
const run = (command, args) => new Promise((resolveRun, reject) => {
  console.log(`BROWSER_SUITE ${args.join(' ')}`);
  const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, SITE_URL: base } });
  child.once('error', reject);
  child.once('exit', (code, signal) => code === 0 ? resolveRun() : reject(new Error(`${args.join(' ')} failed: code=${code} signal=${signal}`)));
});
try {
  let ready = false;
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error(`Preview exited before readiness: ${server.exitCode}`);
    try {
      ready = (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok;
      if (ready) break;
    } catch { /* Retry only while the newly started preview is becoming ready. */ }
    await new Promise(resolveWait => setTimeout(resolveWait, 100));
  }
  assert.ok(ready, 'Native dist preview failed to become ready');
  await run(testPython, ['scripts/verify-ramp-profile.py']);
  await run(process.execPath, ['scripts/verify-avatar-fade.mjs']);
  await run(process.execPath, ['scripts/verify-workstation-video.mjs']);
  await run(process.execPath, ['scripts/verify-theme.mjs']);
  await run(process.execPath, ['scripts/verify-visitor-journey.mjs']);
  await run(process.execPath, ['scripts/capture-soft-fade.mjs']);
  await run(process.execPath, ['scripts/verify-soft-fade.mjs']);
} finally {
  server.kill('SIGTERM');
  await serverExit;
}
