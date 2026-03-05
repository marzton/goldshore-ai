export function initGoldShoreUI() {
  initNav();
  initModal();
  initParallax();
  initReveal();
  initTilt();
  initScrollHints();
}

function initNav() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-gs-nav-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-gs-mobile-panel]');
  if (!toggle || !panel) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('gs-lock', open);
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!open);
  });

  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('[data-gs-nav-close]') || t.matches('[data-gs-mobile-panel]')) setOpen(false);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

function initModal() {
  const root = document.querySelector<HTMLElement>('[data-gs-modal]');
  if (!root) return;

  const backdrop = root.querySelector<HTMLElement>('[data-gs-modal-backdrop]');
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-gs-modal-close]');
  const body = root.querySelector<HTMLElement>('[data-gs-modal-body]');
  const panel = root.querySelector<HTMLElement>('.gs-modal-panel');

  let opener: HTMLElement | null = null;

  const getFocusableElements = () => {
    if (!panel) return [];

    const selectors =
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

    return Array.from(panel.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
    );
  };

  const focusDialog = () => {
    const focusable = getFocusableElements();
    const firstFocusable = focusable[0];
    (firstFocusable ?? panel)?.focus();
  };

  const openModal = (html: string, trigger: HTMLElement) => {
    opener = trigger;
    if (body) body.innerHTML = html;
    root.classList.add('is-open');
    document.documentElement.classList.add('gs-lock');
    focusDialog();
  };

  const closeModal = () => {
    root.classList.remove('is-open');
    document.documentElement.classList.remove('gs-lock');
    opener?.focus();
    opener = null;
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (!root.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    if (e.key !== 'Tab' || !panel) return;

    const focusable = getFocusableElements();
    if (!focusable.length) {
      e.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || active === panel) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const trigger = el.closest<HTMLElement>('[data-gs-modal-open]');
    if (!trigger) return;

    const variant = trigger.getAttribute('data-gs-modal-open') || 'subscribe';
    openModal(getModalTemplate(variant), trigger);
  });

  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);
  window.addEventListener('keydown', onKeydown);
}

function getModalTemplate(variant: string): string {
  if (variant === 'admin') {
    return `
      <div class="gs-modal-head">
        <div class="gs-kicker gs-signal">Secure Access</div>
        <h2 class="gs-modal-title gs-display" id="gs-modal-title">Admin Login</h2>
        <p class="gs-muted" id="gs-modal-description">Restricted. Authentication required.</p>
      </div>
      <form class="gs-form" action="https://admin.goldshore.ai/login" method="POST">
        <label class="gs-label">Email</label>
        <input class="gs-input" name="email" type="email" autocomplete="email" required />
        <label class="gs-label">Password</label>
        <input class="gs-input" name="password" type="password" autocomplete="current-password" required />
        <button class="gs-button gs-button-solid gs-edge-scan" type="submit">Login</button>
      </form>
      <div class="gs-micro gs-muted">If you are not authorized, this will fail silently.</div>
    `;
  }

  return `
      <div class="gs-modal-head">
      <div class="gs-kicker">Signal Brief</div>
      <h2 class="gs-modal-title gs-display" id="gs-modal-title">Subscribe</h2>
      <p class="gs-muted" id="gs-modal-description">Periodic updates on releases, systems, and operational tooling.</p>
    </div>
    <form class="gs-form" action="/api/subscribe" method="POST">
      <label class="gs-label">Email</label>
      <input class="gs-input" name="email" type="email" autocomplete="email" required />
      <button class="gs-button gs-button-solid gs-edge-scan" type="submit">Request Access</button>
      <div class="gs-micro gs-muted">No spam. No public list. Controlled distribution.</div>
    </form>
  `;
}

function initParallax() {
  const hero = document.querySelector<HTMLElement>('[data-gs-hero]');
  if (!hero) return;

  const layers = hero.querySelectorAll<HTMLElement>('[data-gs-parallax]');
  if (!layers.length) return;

  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    layers.forEach((layer) => {
      const depth = Number(layer.getAttribute('data-gs-parallax')) || 1;
      const x = px * depth * 10;
      const y = py * depth * 10;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const rm = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (!rm) hero.addEventListener('pointermove', onMove);
}

function initReveal() {
  const rm = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (rm) return;

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-gs-reveal]'));
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          (ent.target as HTMLElement).classList.add('is-in');
          io.unobserve(ent.target);
        }
      }
    },
    { threshold: 0.15 },
  );

  els.forEach((el) => io.observe(el));
}

function initTilt() {
  const rm = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (rm) return;

  const fine = window.matchMedia?.('(pointer: fine)')?.matches;
  const hover = window.matchMedia?.('(hover: hover)')?.matches;
  if (!fine || !hover) return;

  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-gs-tilt]'));
  if (!panels.length) return;

  document.documentElement.classList.add('gs-tilt-on');

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  panels.forEach((el) => {
    el.classList.add('gs-tilt');

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      const ry = (px - 0.5) * 8;
      const rx = -(py - 0.5) * 6;

      el.style.setProperty('--gs-tilt-x', `${clamp(rx, -8, 8)}deg`);
      el.style.setProperty('--gs-tilt-y', `${clamp(ry, -10, 10)}deg`);
      el.style.setProperty('--gs-tilt-glare-x', `${px * 100}%`);
      el.style.setProperty('--gs-tilt-glare-y', `${py * 100}%`);
    };

    const onLeave = () => {
      el.style.setProperty('--gs-tilt-x', '0deg');
      el.style.setProperty('--gs-tilt-y', '0deg');
      el.style.setProperty('--gs-tilt-glare-x', '50%');
      el.style.setProperty('--gs-tilt-glare-y', '35%');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
  });
}

function initScrollHints() {
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    const ok = CSS.supports('animation-timeline: view()');
    if (ok) document.documentElement.classList.add('gs-view-timeline');
  }
}
