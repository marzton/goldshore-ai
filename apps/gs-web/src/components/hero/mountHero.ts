const drawStars = (canvas: HTMLCanvasElement, speed = 0.2) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 2 + 0.5
  }));

  let frame = 0;
  let raf = 0;

  const render = () => {
    frame += speed;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star) => {
      const y = (star.y + frame * star.z) % canvas.height;
      ctx.globalAlpha = Math.min(1, star.z / 2);
      ctx.fillStyle = '#b9d9ff';
      ctx.fillRect(star.x, y, star.z, star.z);
    });

    raf = requestAnimationFrame(render);
  };

  render();
  return () => cancelAnimationFrame(raf);
};

const fitCanvas = (canvas: HTMLCanvasElement) => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
};

export const mountHero = () => {
  const starfield = document.getElementById('gs-starfield') as HTMLCanvasElement | null;
  const shooting = document.getElementById('gs-shootingstars') as HTMLCanvasElement | null;
  if (!starfield || !shooting) return;

  const resize = () => {
    fitCanvas(starfield);
    fitCanvas(shooting);
  };

  resize();
  const unmountStars = drawStars(starfield, 0.15);
  const unmountShooting = drawStars(shooting, 0.4);
  window.addEventListener('resize', resize);

  return () => {
    unmountStars();
    unmountShooting();
    window.removeEventListener('resize', resize);
  };
};
