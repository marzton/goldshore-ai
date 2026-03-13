import { mountShootingStars } from './ShootingStarsCanvas';
import { mountStarfield } from './StarfieldCanvas';

export const mountHero = (root: ParentNode = document) => {
  const starfield = root.querySelector('[data-stars]') as HTMLCanvasElement | null;
  const shooting = root.querySelector('[data-shooting]') as HTMLCanvasElement | null;
  if (!starfield || !shooting) return () => {};

  const unmountStarfield = mountStarfield(starfield);
  const unmountShooting = mountShootingStars(shooting);

  return () => {
    unmountStarfield();
    unmountShooting();
  };
};
