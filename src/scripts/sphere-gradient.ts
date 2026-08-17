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
      uSpeed: 0.16,
      uStrength: 0.7,
      uTime: 3.8,
      wireframe: false,
      enableCameraControls: false,
      preserveDrawingBuffer: false,
      zoomOut: false,
    },
    'hermes-deployment-lab': {
      // Warm tide contour: a compact orange-to-teal failure signal.
      brightness: 1.45,
      cAzimuthAngle: 250,
      cDistance: 1,
      cPolarAngle: 150,
      cameraZoom: 11.5,
      color1: '#ff810a',
      color2: '#73bfc4',
      color3: '#8da0ce',
      reflection: 0.35,
      rotationY: 145,
      rotationZ: 18,
      uAmplitude: 2.1,
      uDensity: 0.7,
      uFrequency: 3,
      uSpeed: 0.13,
      uStrength: 0.35,
      uTime: 0,
    },
    'hermes-agent-pr-84621': {
      // Cool dense contour: restrained periwinkle with a precise ember edge.
      brightness: 1.5,
      cAzimuthAngle: 40,
      cDistance: 6.5,
      cPolarAngle: 100,
      cameraZoom: 16,
      color1: '#8da0ce',
      color2: '#d0bce1',
      color3: '#ff5005',
      reflection: 0.55,
      rotationY: 220,
      rotationZ: 132,
      envPreset: 'lobby',
      uAmplitude: 1,
      uDensity: 1.35,
      uFrequency: 7.5,
      uSpeed: 0.075,
      uStrength: 0.32,
      uTime: 1.4,
    },
    'regulated-reporting-mcp': {
      // Blue/teal layered contour: a denser regulated field with a signal-orange flare.
      brightness: 1.35,
      cAzimuthAngle: 280,
      cDistance: 2,
      cPolarAngle: 90,
      cameraZoom: 14,
      color1: '#73bfc4',
      color2: '#ff810a',
      color3: '#2b315f',
      reflection: 0.4,
      rotationY: 42,
      rotationZ: 210,
      uAmplitude: 2.4,
      uDensity: 0.75,
      uFrequency: 6.2,
      uSpeed: 0.23,
      uStrength: 0.4,
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
