export const mountHero = (root: ParentNode = document) => {
  const hero = root.querySelector('[data-reactive-hero]') as HTMLElement | null;
  const canvas = hero?.querySelector('[data-wave-bg]') as HTMLCanvasElement | null;
  const logo = hero?.querySelector('[data-reactive-logo]') as SVGElement | null;
  const seam = hero?.querySelector('.gs-logo-seam') as SVGElement | null;
  if (!hero || !canvas || !logo) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let rafId = 0;
  let elapsed = 0;
  let width = 0;
  let height = 0;

  const state = {
    energy: 0,
    targetEnergy: 0,
    dx: 0,
    dy: 0,
    rot: 0,
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };

  const sampleWaveEnergy = (time: number) => {
    const sx = width * 0.26;
    const sy = height * 0.28;

    const value =
      Math.sin(sx * 0.012 + time * 1.15) * 0.55 +
      Math.cos(sy * 0.018 + time * 0.82) * 0.45 +
      Math.sin((sx + sy) * 0.006 + time * 0.55) * 0.25;

    return Math.abs(value);
  };

  const drawWaveField = (time: number) => {
    ctx.clearRect(0, 0, width, height);

    const yStep = Math.max(12, Math.round(height / 54));
    const xStep = Math.max(10, Math.round(width / 84));

    for (let y = 0; y <= height + yStep; y += yStep) {
      ctx.beginPath();

      for (let x = 0; x <= width + xStep; x += xStep) {
        const wave =
          Math.sin(x * 0.0105 + time * 1.1) * 7 +
          Math.cos(y * 0.018 + time * 0.75) * 4 +
          Math.sin((x + y) * 0.004 + time * 0.5) * 3;

        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }

      const alpha = 0.04 + (y / Math.max(height, 1)) * 0.08;
      ctx.strokeStyle = `rgba(90,162,255,${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const updateLogo = (time: number) => {
    state.targetEnergy = sampleWaveEnergy(time);
    state.energy += (state.targetEnergy - state.energy) * 0.08;

    const driftX = clamp(Math.sin(time * 1.2) * 1.2 * state.energy, -2, 2);
    const driftY = clamp(Math.cos(time * 0.95) * 1.6 * state.energy, -2, 2);
    const rotation = clamp(Math.sin(time * 0.7) * 0.8 * state.energy, -1.2, 1.2);

    state.dx += (driftX - state.dx) * 0.12;
    state.dy += (driftY - state.dy) * 0.12;
    state.rot += (rotation - state.rot) * 0.12;

    const glow = clamp(4 + state.energy * 8, 4, 12);
    const glowAlpha = clamp(0.18 + state.energy * 0.24, 0.18, 0.42);
    const opacity = clamp(0.82 + state.energy * 0.12, 0.82, 0.97);
    const seamOpacity = clamp(0.38 + state.energy * 0.45, 0.38, 0.88);

    logo.style.transform = `translate(${state.dx.toFixed(2)}px, ${state.dy.toFixed(
      2,
    )}px) rotate(${state.rot.toFixed(2)}deg)`;
    logo.style.filter = `drop-shadow(0 0 ${glow.toFixed(1)}px rgba(90,162,255,${glowAlpha.toFixed(
      3,
    )}))`;
    logo.style.opacity = opacity.toFixed(3);
    logo.style.setProperty('--gs-logo-seam-opacity', seamOpacity.toFixed(3));

    if (seam) {
      seam.style.opacity = seamOpacity.toFixed(3);
    }
  };

  const frame = () => {
    elapsed += 0.016;
    drawWaveField(elapsed);
    updateLogo(elapsed);
    rafId = window.requestAnimationFrame(frame);
  };

  resize();
  window.addEventListener('resize', resize);
  frame();

  return () => {
    window.removeEventListener('resize', resize);
    if (rafId) window.cancelAnimationFrame(rafId);
  };
};
