const STAR_COUNT = 16;

const initializeHeaderInteractions = () => {
  const header = document.querySelector<HTMLElement>('.gs-header');
  const toggle = header?.querySelector<HTMLButtonElement>('.gs-nav-toggle');
  const menu = header?.querySelector<HTMLElement>('#primary-navigation');

  if (!header || !toggle || !menu || header.dataset.interactionsBound === 'true') {
    return;
  }

  header.dataset.interactionsBound = 'true';

  let ticking = false;
  let wasScrolled = false;
  let lastFocusedBeforeOpen: HTMLElement | null = null;

  const getFocusableMenuItems = () =>
    Array.from(
      menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );

  const setMenuState = (open: boolean) => {
    header.setAttribute('data-menu-open', String(open));
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };

  const closeMenu = ({ restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
    setMenuState(false);
    if (restoreFocus && lastFocusedBeforeOpen instanceof HTMLElement) {
      lastFocusedBeforeOpen.focus();
    }
    lastFocusedBeforeOpen = null;
  };

  const openMenu = () => {
    lastFocusedBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    setMenuState(true);
    const [firstFocusable] = getFocusableMenuItems();
    (firstFocusable ?? toggle).focus();
  };

  const updateHeader = () => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== wasScrolled) {
      header.classList.toggle('is-scrolled', isScrolled);
      wasScrolled = isScrolled;
    }
    ticking = false;
  };

  setMenuState(false);
  updateHeader();

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = header.getAttribute('data-menu-open') === 'true';
    if (isOpen) {
      closeMenu({ restoreFocus: false });
    } else {
      openMenu();
    }
  });

  menu.addEventListener('click', (event) => {
    const routeLink = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (routeLink) {
      closeMenu({ restoreFocus: false });
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.getAttribute('data-menu-open') === 'true') {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (header.getAttribute('data-menu-open') === 'true' && !header.contains(event.target as Node)) {
      closeMenu({ restoreFocus: false });
    }
  });
};

const initializeShootingStars = (container: Element) => {
  if (!(container instanceof HTMLElement)) return;

  const existingStars = container.querySelectorAll('.shooting-star');
  const isInitialized = container.dataset.starsInitialized === 'true';

  if (isInitialized && existingStars.length > 0) {
    return;
  }

  container.replaceChildren();

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const star = document.createElement('span');
    star.className = 'shooting-star';
    container.appendChild(star);
  }

  container.dataset.starsInitialized = 'true';
};

const initializeAllShootingStars = () => {
  document.querySelectorAll('.shooting-stars').forEach((container) => {
    initializeShootingStars(container);
  });
};

const cleanupShootingStars = () => {
  document.querySelectorAll('.shooting-stars[data-stars-initialized="true"]').forEach((container) => {
    container.removeAttribute('data-stars-initialized');
    container.replaceChildren();
  });
};

const initWebLayout = () => {
  initializeHeaderInteractions();
  initializeAllShootingStars();
};

document.addEventListener('astro:page-load', initWebLayout);
document.addEventListener('astro:before-swap', cleanupShootingStars);
document.addEventListener('astro:after-swap', initializeAllShootingStars);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWebLayout, { once: true });
} else {
  initWebLayout();
}
