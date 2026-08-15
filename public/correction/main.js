import { ShaderMount } from './vendor/paper-shaders/shader-mount.js';
import { ShaderFitOptions } from './vendor/paper-shaders/shader-sizing.js';
import { pulsingBorderFragmentShader } from './vendor/paper-shaders/shaders/pulsing-border.js';
import { getShaderNoiseTexture } from './vendor/paper-shaders/get-shader-noise-texture.js';

const MAX_PIXEL_COUNT = 131_072;
const MIN_PIXEL_RATIO = 1;
const RELEASE_MS = 360;
const AMBIENT_SPEED = 0.58;
const ACTIVE_SPEED = 1.65;
const REST_FRAME = 48;
const AMBIENT_INTENSITY = 0.18;
const ACTIVE_INTENSITY = 0.52;
const AMBIENT_BLOOM = 0.06;
const ACTIVE_BLOOM = 0.13;
const AMBIENT_SPOT_SIZE = 0.2;
const ACTIVE_SPOT_SIZE = 0.3;
const AMBIENT_PULSE = 0.04;
const ACTIVE_PULSE = 0.18;

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const state = {
  webglAvailable: false,
  motionReduced: motionQuery.matches,
  shaderSpeed: 0,
  maxPixelCount: MAX_PIXEL_COUNT,
  hostCount: 0,
  mountCount: 0,
  activeCount: 0,
};

/** @type {Map<HTMLElement, { mount: ShaderMount, active: boolean, visible: boolean, releaseTimer: ReturnType<typeof setTimeout> | null }>} */
const controllers = new Map();
/** @type {IntersectionObserver | null} */
let visibilityObserver = null;

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

function ambientUniforms(noise) {
  return {
    ...sizingUniforms(),
    u_colorBack: [0.082, 0.082, 0.082, 1],
    u_colors: [
      [0.953, 0.937, 0.898, 0.9],
      [0.812, 0.255, 0.125, 0.98],
      [0.129, 0.31, 0.898, 0.98],
      [0.953, 0.937, 0.898, 0.42],
    ],
    u_colorsCount: 4,
    u_roundness: 0.32,
    u_thickness: 0.078,
    u_marginLeft: 0.02,
    u_marginRight: 0.02,
    u_marginTop: 0.06,
    u_marginBottom: 0.06,
    u_aspectRatio: 0,
    u_softness: 0.1,
    u_intensity: AMBIENT_INTENSITY,
    u_bloom: AMBIENT_BLOOM,
    u_spotSize: AMBIENT_SPOT_SIZE,
    u_spots: 3,
    u_pulse: AMBIENT_PULSE,
    u_smoke: 0.025,
    u_smokeSize: 0.4,
    u_noiseTexture: noise,
  };
}

function refreshState() {
  const mounted = [...controllers.values()];
  const speeds = mounted.map(({ mount }) => mount.speed);
  state.mountCount = mounted.length;
  state.activeCount = mounted.filter(({ active }) => active).length;
  state.shaderSpeed = speeds.length ? Math.max(...speeds) : 0;
  state.webglAvailable = mounted.length > 0;
  document.documentElement.dataset.effectsWebgl = state.webglAvailable ? 'true' : 'false';
}

function syncController(controller) {
  const running = !state.motionReduced && !document.hidden && controller.visible;
  controller.mount.setUniforms({
    u_intensity: controller.active ? ACTIVE_INTENSITY : AMBIENT_INTENSITY,
    u_bloom: controller.active ? ACTIVE_BLOOM : AMBIENT_BLOOM,
    u_spotSize: controller.active ? ACTIVE_SPOT_SIZE : AMBIENT_SPOT_SIZE,
    u_spots: controller.active ? 4 : 3,
    u_pulse: controller.active ? ACTIVE_PULSE : AMBIENT_PULSE,
    u_smoke: controller.active ? 0.07 : 0.025,
  });
  controller.mount.setSpeed(running ? (controller.active ? ACTIVE_SPEED : AMBIENT_SPEED) : 0);
  refreshState();
}

function clearRelease(controller) {
  if (controller.releaseTimer !== null) {
    clearTimeout(controller.releaseTimer);
    controller.releaseTimer = null;
  }
}

function activate(controller) {
  clearRelease(controller);
  controller.active = true;
  syncController(controller);
}

function release(controller) {
  clearRelease(controller);
  controller.releaseTimer = setTimeout(() => {
    controller.active = false;
    controller.releaseTimer = null;
    syncController(controller);
  }, RELEASE_MS);
}

function confineCanvas(host) {
  const canvas = host.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.pointerEvents = 'none';
}

function mountPrimary(host, noise) {
  const mount = new ShaderMount(
    host,
    pulsingBorderFragmentShader,
    ambientUniforms(noise),
    { alpha: true, antialias: true, failIfMajorPerformanceCaveat: false },
    0,
    REST_FRAME,
    MIN_PIXEL_RATIO,
    MAX_PIXEL_COUNT,
  );
  confineCanvas(host);
  const controller = { mount, active: false, visible: true, releaseTimer: null };
  controllers.set(host, controller);
  syncController(controller);
  return controller;
}

function bindPrimary(host, controller) {
  host.addEventListener('pointerenter', () => activate(controller));
  host.addEventListener('pointerdown', () => activate(controller));
  host.addEventListener('focus', () => activate(controller));
  host.addEventListener('pointerleave', () => release(controller));
  host.addEventListener('pointerup', () => release(controller));
  host.addEventListener('pointercancel', () => release(controller));
  host.addEventListener('blur', () => release(controller));
}


function exposeState() {
  Object.defineProperty(window, 'premiumControlState', {
    configurable: true,
    enumerable: true,
    get() {
      return {
        ...state,
        speeds: [...controllers.values()].map(({ mount }) => mount.speed),
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
    controllers.forEach(syncController);
  });

  document.addEventListener('visibilitychange', () => controllers.forEach(syncController));

  const hosts = [...document.querySelectorAll('[data-shader-host]')].filter(
    (host) => host instanceof HTMLElement,
  );
  state.hostCount = hosts.length;

  try {
    const noise = getShaderNoiseTexture();
    if (!(noise instanceof HTMLImageElement)) throw new Error('noise texture unavailable');
    await waitForImage(noise);

    visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const controller = controllers.get(entry.target);
        if (!controller) return;
        controller.visible = entry.isIntersecting;
        syncController(controller);
      });
    }, { rootMargin: '96px 0px', threshold: 0.01 });

    for (const host of hosts) {
      try {
        const controller = mountPrimary(host, noise);
        bindPrimary(host, controller);
        visibilityObserver.observe(host);
      } catch {
        host.querySelectorAll('canvas').forEach((node) => node.remove());
      }
    }
    refreshState();
  } catch {
    state.webglAvailable = false;
    for (const host of hosts) {
      host.querySelectorAll('canvas').forEach((node) => node.remove());
    }
    refreshState();
  } finally {
    markReady();
  }
}

window.addEventListener('pagehide', () => {
  visibilityObserver?.disconnect();
  visibilityObserver = null;
  controllers.forEach((controller) => {
    clearRelease(controller);
    controller.mount.dispose();
  });
  controllers.clear();
  refreshState();
});

init();
