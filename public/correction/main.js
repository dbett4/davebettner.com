import { ShaderMount } from './vendor/paper-shaders/shader-mount.js';
import { ShaderFitOptions } from './vendor/paper-shaders/shader-sizing.js';
import { pulsingBorderFragmentShader } from './vendor/paper-shaders/shaders/pulsing-border.js';
import { getShaderNoiseTexture } from './vendor/paper-shaders/get-shader-noise-texture.js';

const MAX_PIXEL_COUNT = 262_144;
const MIN_PIXEL_RATIO = 1;
const SWEEP_MS = 800;
const REST_INTENSITY = 0.09;
const SWEEP_INTENSITY = 0.28;
const SWEEP_SPEED = 0.34;
const REST_FRAME = 96;
const REST_BLOOM = 0.07;
const SWEEP_BLOOM = 0.08;
const REST_SPOT_SIZE = 0.22;
const SWEEP_SPOT_SIZE = 0.26;
const REST_SPOTS = 1;
const SWEEP_SPOTS = 2;

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  webglAvailable: false,
  motionReduced: motionQuery.matches,
  shaderSpeed: 0,
  maxPixelCount: MAX_PIXEL_COUNT,
};

/** @type {ShaderMount | null} */
let mount = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let settleTimer = null;

function sizingUniforms() {
  return {
    u_fit: ShaderFitOptions.none,
    u_scale: 1,
    u_rotation: 0,
    u_offsetX: 0,
    u_offsetY: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_worldWidth: 0,
    u_worldHeight: 0,
  };
}

function waitForImage(image) {
  return new Promise((resolve, reject) => {
    if (image.complete && image.naturalWidth > 0) {
      resolve(image);
      return;
    }
    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', () => reject(new Error('noise texture failed')), { once: true });
  });
}

function restUniforms(noise) {
  return {
    ...sizingUniforms(),
    u_colorBack: [0.039, 0.043, 0.047, 0.94],
    u_colors: [
      [0.906, 0.914, 0.929, 0.82],
      [0.545, 0.569, 0.604, 0.72],
      [0.412, 0.376, 0.706, 0.42],
      [0.42, 0.706, 0.745, 0.32],
    ],
    u_colorsCount: 4,
    u_roundness: 0.32,
    u_thickness: 0.065,
    u_marginLeft: 0.02,
    u_marginRight: 0.02,
    u_marginTop: 0.06,
    u_marginBottom: 0.06,
    u_aspectRatio: 0,
    u_softness: 0.14,
    u_intensity: REST_INTENSITY,
    u_bloom: REST_BLOOM,
    u_spotSize: REST_SPOT_SIZE,
    u_spots: REST_SPOTS,
    u_pulse: 0,
    u_smoke: 0,
    u_smokeSize: 0.4,
    u_noiseTexture: noise,
  };
}

function clearSettle() {
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function settle() {
  if (!mount) return;
  mount.setSpeed(0);
  mount.setUniforms({
    u_intensity: REST_INTENSITY,
    u_bloom: REST_BLOOM,
    u_spotSize: REST_SPOT_SIZE,
    u_spots: REST_SPOTS,
  });
  state.shaderSpeed = 0;
}

function startSweep() {
  if (!mount || state.motionReduced) return;
  mount.setUniforms({
    u_intensity: SWEEP_INTENSITY,
    u_bloom: SWEEP_BLOOM,
    u_spotSize: SWEEP_SPOT_SIZE,
    u_spots: SWEEP_SPOTS,
  });
  mount.setSpeed(SWEEP_SPEED);
  state.shaderSpeed = SWEEP_SPEED;
  clearSettle();
  settleTimer = setTimeout(() => {
    settle();
    settleTimer = null;
  }, SWEEP_MS);
}

function confineCanvas(host) {
  const canvas = host.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents = 'none';
}

async function mountPrimary(host) {
  const noise = getShaderNoiseTexture();
  if (!(noise instanceof HTMLImageElement)) {
    return;
  }
  await waitForImage(noise);

  mount = new ShaderMount(
    host,
    pulsingBorderFragmentShader,
    restUniforms(noise),
    { alpha: true, antialias: true, failIfMajorPerformanceCaveat: false },
    0,
    REST_FRAME,
    MIN_PIXEL_RATIO,
    MAX_PIXEL_COUNT,
  );
  mount.setSpeed(0);
  state.shaderSpeed = 0;
  state.webglAvailable = true;
  confineCanvas(host);
}

function bindPrimary(host) {
  host.addEventListener('pointerenter', startSweep);
  host.addEventListener('focus', startSweep);
  host.addEventListener('pointerleave', () => {
    if (state.motionReduced) return;
    clearSettle();
    settleTimer = setTimeout(() => {
      settle();
      settleTimer = null;
    }, SWEEP_MS);
  });
}


function exposeState() {
  Object.defineProperty(window, 'premiumControlState', {
    configurable: true,
    enumerable: true,
    get() {
      return {
        ...state,
        shaderSpeed: mount ? mount.speed : state.shaderSpeed,
        mountSpeed: mount ? mount.speed : null,
      };
    },
  });
}

function markReady() {
  document.documentElement.dataset.effectsReady = 'true';
}

async function init() {
  exposeState();
  motionQuery.addEventListener('change', (event) => {
    state.motionReduced = event.matches;
    if (state.motionReduced) {
      clearSettle();
      settle();
    }
  });

  const host = document.querySelector('[data-shader-host]');
  try {
    if (host instanceof HTMLElement) {
      await mountPrimary(host);
      bindPrimary(host);
    }
  } catch {
    state.webglAvailable = false;
    mount = null;
    if (host instanceof HTMLElement) {
      host.querySelectorAll('canvas').forEach((node) => node.remove());
    }
  } finally {
    markReady();
  }
}

window.addEventListener('pagehide', () => {
  clearSettle();
  mount?.dispose();
  mount = null;
});

init();
