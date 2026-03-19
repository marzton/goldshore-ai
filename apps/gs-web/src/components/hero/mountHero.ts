type Cleanup = () => void;

type HeroState = {
  energy: number;
  targetEnergy: number;
  dx: number;
  dy: number;
  rot: number;
  seam: number;
};

const MAX_DRIFT_X = 1.45;
const MAX_DRIFT_Y = 1.8;
const MAX_ROTATION = 0.95;
const MAX_GLOW = 12;
const BASE_GLOW = 4;
const BASE_OPACITY = 0.82;
const OPACITY_RANGE = 0.12;
const BASE_SEAM_OPACITY = 0.28;
const SEAM_OPACITY_RANGE = 0.42;
const BASE_SEAM_WIDTH = 1.8;
const SEAM_WIDTH_RANGE = 0.35;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sampleWaveEnergy = (time: number, width: number, height: number) => {
  const sx = width * 0.26;
  const sy = height * 0.28;
  const signal =
    Math.sin(sx * 0.012 + time * 1.15) * 0.55 +
    Math.cos(sy * 0.018 + time * 0.82) * 0.45 +
    Math.sin((sx + sy) * 0.006 + time * 0.55) * 0.25;

  return clamp(Math.abs(signal) / 1.25, 0, 1);
};

export const mountHero = (root: ParentNode = document): Cleanup => {
  const heroes = Array.from(root.querySelectorAll('[data-reactive-hero]')) as HTMLElement[];
  const cleanups = heroes
    .map((hero) => mountReactiveHero(hero))
    .filter((cleanup): cleanup is Cleanup => typeof cleanup === 'function');

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

const mountReactiveHero = (hero: HTMLElement): Cleanup | void => {
  if (hero.dataset.reactiveHeroMounted === 'true') return;

  const canvas = hero.querySelector('[data-wave-bg]') as HTMLCanvasElement | null;
  const logo = hero.querySelector('[data-reactive-logo]') as SVGElement | null;
  const seam = hero.querySelector('.gs-logo-seam') as SVGPathElement | null;
  if (!canvas || !logo || !seam) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  hero.dataset.reactiveHeroMounted = 'true';

  let frameId = 0;
  let resizeObserver: ResizeObserver | null = null;
  let width = 0;
  let height = 0;
  let time = 0;
  let lastTick = 0;

  const state: HeroState = {
    energy: 0,
    targetEnergy: 0,
    dx: 0,
    dy: 0,
    rot: 0,
    seam: 0,
  };

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawWaveField = (phase: number) => {
    ctx.clearRect(0, 0, width, height);

    for (let y = 0; y <= height; y += 12) {
      ctx.beginPath();

      for (let x = 0; x <= width; x += 12) {
        const wave =
          Math.sin(x * 0.0105 + phase * 1.1) * 7 +
          Math.cos(y * 0.018 + phase * 0.75) * 4 +
          Math.sin((x + y) * 0.004 + phase * 0.5) * 3;

        if (x === 0) {
          ctx.moveTo(x, y + wave);
        } else {
          ctx.lineTo(x, y + wave);
        }
      }

      const alpha = 0.035 + (y / Math.max(height, 1)) * 0.075;
      ctx.strokeStyle = `rgba(90, 162, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const updateLogo = (phase: number) => {
    state.targetEnergy = sampleWaveEnergy(phase, width, height);
    state.energy += (state.targetEnergy - state.energy) * 0.08;

    if (prefersReducedMotion()) {
      const glow = BASE_GLOW + state.energy * 3;
      const glowAlpha = 0.12 + state.energy * 0.12;
      logo.style.transform = 'translate(0px, 0px) rotate(0deg)';
      logo.style.filter = `drop-shadow(0 0 ${glow.toFixed(1)}px rgba(90,162,255,${glowAlpha.toFixed(3)}))`;
      logo.style.opacity = (0.88 + state.energy * 0.06).toFixed(3);
      seam.style.opacity = (BASE_SEAM_OPACITY + state.energy * 0.18).toFixed(3);
      seam.style.strokeWidth = `${(BASE_SEAM_WIDTH + state.energy * 0.12).toFixed(2)}`;
      return;
    }

    const driftX = Math.sin(phase * 1.2) * MAX_DRIFT_X * state.energy;
    const driftY = Math.cos(phase * 0.95) * MAX_DRIFT_Y * state.energy;
    const rotation = Math.sin(phase * 0.7) * MAX_ROTATION * state.energy;
    const seamPulse = Math.sin(phase * 1.65 + 0.8) * 0.5 + 0.5;

    state.dx += (driftX - state.dx) * 0.12;
    state.dy += (driftY - state.dy) * 0.12;
    state.rot += (rotation - state.rot) * 0.12;
    state.seam += ((seamPulse * state.energy) - state.seam) * 0.16;

    const glow = clamp(BASE_GLOW + state.energy * 8, BASE_GLOW, MAX_GLOW);
    const glowAlpha = 0.16 + state.energy * 0.22;
    const opacity = BASE_OPACITY + state.energy * OPACITY_RANGE;
    const seamOpacity = BASE_SEAM_OPACITY + state.seam * SEAM_OPACITY_RANGE;
    const seamWidth = BASE_SEAM_WIDTH + state.seam * SEAM_WIDTH_RANGE;

    logo.style.transform = `translate(${state.dx.toFixed(2)}px, ${state.dy.toFixed(2)}px) rotate(${state.rot.toFixed(2)}deg)`;
    logo.style.filter = `drop-shadow(0 0 ${glow.toFixed(1)}px rgba(90,162,255,${glowAlpha.toFixed(3)}))`;
    logo.style.opacity = opacity.toFixed(3);
    seam.style.opacity = seamOpacity.toFixed(3);
    seam.style.strokeWidth = seamWidth.toFixed(2);
  };

  const tick = (now: number) => {
    if (!lastTick) lastTick = now;
    const delta = Math.min((now - lastTick) / 1000, 0.033);
    lastTick = now;
    time += delta || 0.016;

    drawWaveField(time);
    updateLogo(time);

    frameId = window.requestAnimationFrame(tick);
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hero);
  window.addEventListener('resize', resize);
  resize();
  frameId = window.requestAnimationFrame(tick);

  return () => {
    hero.dataset.reactiveHeroMounted = 'false';
    if (frameId) window.cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', resize);
  };
};
