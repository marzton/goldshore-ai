import VanillaTilt from 'vanilla-tilt';

let tiltInstances: Array<{ destroy: () => void }> = [];
let starCanvas: HTMLCanvasElement | null = null;
let starAnimationId: number | null = null;

export function initTilt(selector = '[data-tilt]') {
  const elements = document.querySelectorAll(selector);

  elements.forEach((el) => {
    VanillaTilt.init(el as HTMLElement, {
      max: 6,
      speed: 500,
      scale: 1.03,
      glare: false,
    });

    const instance = (el as HTMLElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt;
    if (instance) tiltInstances.push(instance);
  });
}

export function initStarField(id = 'hero-stars') {
  starCanvas = document.getElementById(id) as HTMLCanvasElement | null;
  if (!starCanvas) return;

  const ctx = starCanvas.getContext('2d');
  if (!ctx) return;

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * starCanvas!.width,
    y: Math.random() * starCanvas!.height,
    r: Math.random() * 1.2,
    v: Math.random() * 0.25 + 0.05,
  }));

  function frame() {
    if (!starCanvas) return;

    ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    stars.forEach((s) => {
      s.y += s.v;
      if (s.y > starCanvas!.height) s.y = 0;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,230,255,.85)';
      ctx.fill();
    });

    starAnimationId = requestAnimationFrame(frame);
  }

  frame();
}

export function cleanupUI() {
  tiltInstances.forEach((t) => t.destroy());
  tiltInstances = [];

  if (starAnimationId !== null) cancelAnimationFrame(starAnimationId);
  starAnimationId = null;
  starCanvas = null;
}
