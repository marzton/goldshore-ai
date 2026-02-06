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

  // Bolt: Use Map to store state and track visibility
  const layers = new Map<HTMLElement, { speed: number; isVisible: boolean }>();
  const elements = document.querySelectorAll<HTMLElement>(selector);

  if (elements.length === 0) {
    return () => undefined;
  }

  // Bolt: Optimization - Use IntersectionObserver to skip updates for off-screen elements
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const state = layers.get(entry.target as HTMLElement);
        if (state) {
          state.isVisible = entry.isIntersecting;
          // Force an immediate update when becoming visible to avoid jump
          if (state.isVisible) {
             const scrollY = window.scrollY || window.pageYOffset;
             const offset = scrollY * state.speed * factor;
             (entry.target as HTMLElement).style.setProperty('--gs-parallax-offset', `${offset}px`);
          }
        }
      });
    },
    { rootMargin: '200px' } // Pre-calculate before entering viewport
  );

  elements.forEach((element) => {
    layers.set(element, {
      speed: parseFloat(element.getAttribute(speedAttribute) || '0'),
      isVisible: true // Start visible to ensure initial position is calculated
    });
    observer.observe(element);
  });
  // Bolt: Optimize by tracking visibility to avoid layout thrashing for off-screen elements
  const layers = Array.from(elements).map((element) => ({
    element,
    speed: parseFloat(element.getAttribute(speedAttribute) || '0'),
    isVisible: true // Start visible to ensure initial position is set, IntersectionObserver will correct this
  }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const layer = layers.find((l) => l.element === entry.target);
      if (layer) {
        layer.isVisible = entry.isIntersecting;
      }
    });
  }, { rootMargin: '200px' });

  layers.forEach((l) => observer.observe(l.element));

  let ticking = false;
  const updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;

    layers.forEach((state, element) => {
      if (!state.isVisible) return;

      const offset = scrollY * state.speed * factor;
      element.style.setProperty('--gs-parallax-offset', `${offset}px`);
    });
    ticking = false;
  };

  // Initial update
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
    observer.disconnect();
  };
};
