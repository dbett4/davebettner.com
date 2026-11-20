// One native test entrypoint: every current browser verifier is mandatory.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';

const testPython = process.env.SITE_TEST_PYTHON || '/usr/bin/python3';
assert.ok(isAbsolute(testPython), 'SITE_TEST_PYTHON must be an absolute interpreter path');

const dist = resolve('dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.mp4': 'video/mp4',
};

// Serves dist/ like the production host does, including HTTP Range requests, so a video can be seeked.
const serve = async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return response.writeHead(400).end(); }
  const target = normalize(join(dist, pathname));
  if (target !== dist && !target.startsWith(dist + sep)) return response.writeHead(404).end();
  let file = target;
  let info = await stat(file).catch(() => null);
  if (info?.isDirectory()) {
    if (!url.pathname.endsWith('/')) return response.writeHead(301, { location: url.pathname + '/' + url.search }).end();
    file = join(target, 'index.html');
    info = await stat(file).catch(() => null);
  }
  if (!info?.isFile()) return response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
  const headers = { 'content-type': types[extname(file)] || 'application/octet-stream', 'accept-ranges': 'bytes' };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range || '');
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  if (range && (range[1] || range[2])) {
    start = range[1] ? Number(range[1]) : Math.max(info.size - Number(range[2]), 0);
    end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
    if (start > end || start >= info.size) return response.writeHead(416, { 'content-range': `bytes */${info.size}` }).end();
    status = 206;
    headers['content-range'] = `bytes ${start}-${end}/${info.size}`;
  }
  headers['content-length'] = Math.max(end - start + 1, 0);
  response.writeHead(status, headers);
  if (request.method === 'HEAD' || info.size === 0) return response.end();
  createReadStream(file, { start, end }).once('error', () => response.destroy()).pipe(response);
};
const server = createServer((request, response) => {
  serve(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
});
await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolveListen);
});
const base = `http://127.0.0.1:${server.address().port}`;
const run = (command, args) => new Promise((resolveRun, reject) => {
  console.log(`BROWSER_SUITE ${args.join(' ')}`);
  const child = spawn(command, args, { stdio: 'inherit', env: { ...process.env, SITE_URL: base } });
  child.once('error', reject);
  child.once('exit', (code, signal) => code === 0 ? resolveRun() : reject(new Error(`${args.join(' ')} failed: code=${code} signal=${signal}`)));
});
try {
  await run(testPython, ['scripts/verify-ramp-profile.py']);
  await run(process.execPath, ['scripts/verify-workflow-lesson.mjs']);
  await run(process.execPath, ['scripts/verify-build-notes.mjs']);
  await run(process.execPath, ['scripts/verify-avatar-fade.mjs']);
  await run(process.execPath, ['scripts/verify-workstation-video.mjs']);
  await run(process.execPath, ['scripts/verify-theme.mjs']);
  await run(process.execPath, ['scripts/verify-visitor-journey.mjs']);
  await run(process.execPath, ['scripts/capture-soft-fade.mjs']);
  await run(process.execPath, ['scripts/verify-soft-fade.mjs']);
} finally {
  server.close();
  server.closeAllConnections();
}
