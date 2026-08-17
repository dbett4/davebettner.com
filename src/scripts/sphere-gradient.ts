import { ShaderGradient, type ShaderGradientInput } from '@shader-gradient/core';

const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-sphere-gradient]'));

if (containers.length > 0) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gradients: ShaderGradient[] = [];

  // Pensive is the ShaderGradient reference fit: a fully resolved sphere with a
  // distant camera. Each card keeps that silhouette, then shifts palette,
  // camera, and deformation so the signals feel related without looking cloned.
  const shared: Partial<ShaderGradientInput> = {
    type: 'sphere',
    shader: 'defaults',
    animate: reducedMotion ? 'off' : 'on',
    axesHelper: 'off',
    envPreset: 'city',
    envBasePath: '/hdr/',
    fov: 45,
    grain: 'on',
    lightType: '3d',
    pixelDensity: 1,
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    range: 'disabled',
    rangeEnd: 40,
    rangeStart: 0,
    wireframe: false,
    enableCameraControls: false,
    preserveDrawingBuffer: false,
    zoomOut: true,
  };

  const sphereById: Record<string, Partial<ShaderGradientInput>> = {
    '': {
      // Homepage hero: the authored Tide / Signal field.
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
      zoomOut: false,
    },
    'hermes-deployment-lab': {
      // The user's Tide / Signal study: warm failure signal against cool control.
      brightness: 1.5,
      cAzimuthAngle: 270,
      cDistance: 0.5,
      cPolarAngle: 180,
      cameraZoom: 4.19,
      color1: '#73bfc4',
      color2: '#ff810a',
      color3: '#8da0ce',
      reflection: 0.4,
      rotationY: 130,
      rotationZ: 70,
      uAmplitude: 1.4,
      uDensity: 0.8,
      uFrequency: 5.5,
      uSpeed: 0.3,
      uStrength: 0.24,
      uTime: 0,
    },
    'hermes-agent-pr-84621': {
      // Restrained brand treatment: ember, rose, and lavender.
      brightness: 1.35,
      cAzimuthAngle: 320,
      cDistance: 1.2,
      cPolarAngle: 128,
      cameraZoom: 10.5,
      color1: '#ff5005',
      color2: '#dbba95',
      color3: '#d0bce1',
      reflection: 0.42,
      rotationY: 190,
      rotationZ: 118,
      uAmplitude: 1.8,
      uDensity: 0.95,
      uFrequency: 5.5,
      uSpeed: 0.24,
      uStrength: 0.27,
      uTime: 1.4,
    },
    'regulated-reporting-mcp': {
      // Periwinkle-forward control surface with Tide orange as a small flare.
      brightness: 1.3,
      cAzimuthAngle: 220,
      cDistance: 1.4,
      cPolarAngle: 116,
      cameraZoom: 11.5,
      color1: '#8da0ce',
      color2: '#73bfc4',
      color3: '#ff810a',
      reflection: 0.46,
      rotationY: 42,
      rotationZ: 145,
      uAmplitude: 1.6,
      uDensity: 0.9,
      uFrequency: 5.5,
      uSpeed: 0.28,
      uStrength: 0.25,
      uTime: 2.6,
    },
  };

  containers.forEach((container) => {
    const id = container.dataset.sphereGradient ?? '';
    const options = { ...shared, ...sphereById[id] };

    try {
      const gradient = new ShaderGradient(container, options);
      gradients.push(gradient);
      container.querySelectorAll('canvas').forEach((canvas) => {
        canvas.setAttribute('aria-hidden', 'true');
        canvas.setAttribute('role', 'presentation');
      });
      if (reducedMotion) gradient.renderFrame(Number(options.uTime ?? 0));
      container.dataset.webgl = 'ready';
    } catch (error) {
      container.dataset.webgl = 'fallback';
      console.error(`Sphere gradient initialization failed for ${id || 'hero'}:`, error);
    }
  });

  document.documentElement.dataset.interstellarReady = 'true';
  document.documentElement.dataset.effectsReady = 'true';
  window.addEventListener('pagehide', () => gradients.forEach((gradient) => gradient.dispose()), { once: true });
}
