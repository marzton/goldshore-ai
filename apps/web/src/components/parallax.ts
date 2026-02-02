export type ParallaxOptions = {
  selector?: string;
  speedAttribute?: string;
  factor?: number;
};

export const initParallax = (options: ParallaxOptions = {}) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return () => undefined;
  }

  const {
    selector = '[data-parallax]',
    speedAttribute = 'data-parallax',
    factor = -0.12
  } = options;

  const layers = Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => ({
    element,
    speed: parseFloat(element.getAttribute(speedAttribute) || '0')
  }));

  if (layers.length === 0) {
    return () => undefined;
  }

  let ticking = false;
  const updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    layers.forEach(({ element, speed }) => {
      const offset = scrollY * speed * factor;
      element.style.setProperty('--gs-parallax-offset', `${offset}px`);
    });
    ticking = false;
  };

  updateParallax();

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', updateParallax);

  return () => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', updateParallax);
  };
};
