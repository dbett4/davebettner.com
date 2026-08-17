import { ShaderGradient } from '@shader-gradient/core';

const container = document.querySelector<HTMLElement>('[data-sphere-gradient]');

if (container) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const gradient = new ShaderGradient(container, {
      type: 'sphere',
      shader: 'defaults',
      animate: reducedMotion ? 'off' : 'on',
      axesHelper: 'off',
      brightness: 0.8,
      cAzimuthAngle: 270,
      cDistance: 0.5,
      cPolarAngle: 180,
      cameraZoom: 3.3,
      color1: '#73bfc4',
      color2: '#ff810a',
      color3: '#8da0ce',
      envPreset: 'city',
      envBasePath: '/hdr/',
      fov: 20,
      grain: 'on',
      lightType: 'env',
      pixelDensity: 1,
      positionX: -0.1,
      positionY: 0,
      positionZ: 0,
      range: 'disabled',
      rangeEnd: 33.3,
      rangeStart: 3.8,
      reflection: 0.5,
      rotationX: 0,
      rotationY: 130,
      rotationZ: 70,
      uAmplitude: 1.8,
      uDensity: 1.7,
      uFrequency: 5.5,
      uSpeed: 0.2,
      uStrength: 0.7,
      uTime: 3.8,
      wireframe: false,
      enableCameraControls: false,
      preserveDrawingBuffer: false,
    });

    container.querySelectorAll('canvas').forEach((canvas) => {
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('role', 'presentation');
    });
    if (reducedMotion) gradient.renderFrame(3.8);
    container.dataset.webgl = 'ready';
    document.documentElement.dataset.interstellarReady = 'true';
    document.documentElement.dataset.effectsReady = 'true';
    window.addEventListener('pagehide', () => gradient.dispose(), { once: true });
  } catch (error) {
    container.dataset.webgl = 'fallback';
    document.documentElement.dataset.interstellarReady = 'true';
    document.documentElement.dataset.effectsReady = 'true';
    console.error('Sphere gradient initialization failed:', error);
  }
}
