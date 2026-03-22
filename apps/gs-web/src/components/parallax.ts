export type ParallaxOptions = {
  selector?: string;
  speedAttribute?: string;
  factor?: number;
};

type ParallaxLayer = {
  element: HTMLElement;
  speed: number;
  isVisible: boolean;
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

  const layers: ParallaxLayer[] = Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => ({
    element,
    speed: Number.parseFloat(element.getAttribute(speedAttribute) || '0'),
    isVisible: false
  }));

  if (layers.length === 0) {
    return () => undefined;
  }

  const layerByElement = new Map(layers.map((layer) => [layer.element, layer]));
  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY || window.pageYOffset;

    layers.forEach(({ element, speed, isVisible }) => {
      if (!isVisible) return;
      const offset = scrollY * speed * factor;
      element.style.setProperty('--gs-parallax-offset', `${offset}px`);
    });

    ticking = false;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      let needsUpdate = false;

      entries.forEach((entry) => {
        const layer = layerByElement.get(entry.target as HTMLElement);
        if (!layer || layer.isVisible === entry.isIntersecting) {
          return;
        }

        layer.isVisible = entry.isIntersecting;
        needsUpdate = true;
      });

      if (needsUpdate) {
        updateParallax();
      }
    },
    { rootMargin: '200px' }
  );

  layers.forEach(({ element }) => observer.observe(element));
  updateParallax();

  const handleScroll = () => {
    if (!layers.some(({ isVisible }) => isVisible)) return;

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

    layers.forEach(({ element }) => {
      element.style.removeProperty('--gs-parallax-offset');
    });
  };
};
