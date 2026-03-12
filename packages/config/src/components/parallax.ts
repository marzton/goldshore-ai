
export function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    parallaxElements.forEach((el) => {
      const speed = parseFloat((el as HTMLElement).dataset.parallax || '0');
      (el as HTMLElement).style.transform = `translateY(${scrollY * speed}px)`;
    });
  });
}
