/**
 * Detects if the user has requested reduced motion at the system level.
 * @returns boolean
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Listens for changes in the user's reduced motion preference.
 * @param callback Function to call when preference changes
 * @returns Cleanup function to remove the listener
 */
export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (event: MediaQueryListEvent) => callback(event.matches);

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else {
    // Fallback for older browsers
    // @ts-ignore
    mediaQuery.addListener(handler);
    // @ts-ignore
    return () => mediaQuery.removeListener(handler);
  }
}
