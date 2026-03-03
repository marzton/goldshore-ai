import { initTiltPanels } from "./runtime/tilt";
export function initGoldShoreUI() {
  initNav();
  initModal();
  initParallax();
  initTiltPanels();
  document.documentElement.classList.add("gs-motion-ready");
  initReveal();
  initTiltPanels();
}

function initNav() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-gs-nav-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-gs-mobile-panel]");
  if (!toggle || !panel) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("gs-lock", open);
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  panel.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.matches("[data-gs-nav-close]") || t.matches("[data-gs-mobile-panel]")) setOpen(false);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function initModal() {
  const root = document.querySelector<HTMLElement>("[data-gs-modal]");
  if (!root) return;

  const backdrop = root.querySelector<HTMLElement>("[data-gs-modal-backdrop]");
  const closeBtn = root.querySelector<HTMLButtonElement>("[data-gs-modal-close]");
  const body = root.querySelector<HTMLElement>("[data-gs-modal-body]");

  const openModal = (html: string) => {
    if (body) body.innerHTML = html;
    root.classList.add("is-open");
    document.documentElement.classList.add("gs-lock");
  };

  const closeModal = () => {
    root.classList.remove("is-open");
    document.documentElement.classList.remove("gs-lock");
  };

  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    const trigger = el.closest<HTMLElement>("[data-gs-modal-open]");
    if (!trigger) return;

    const variant = trigger.getAttribute("data-gs-modal-open") || "subscribe";
    openModal(getModalTemplate(variant));
  });

  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => (e.key === "Escape" ? closeModal() : null));
}

function getModalTemplate(variant: string): string {
  if (variant === "admin") {
    return `
      <div class="gs-modal-head">
        <div class="gs-kicker gs-signal">Secure Access</div>
        <h2 class="gs-modal-title gs-display">Admin Login</h2>
        <p class="gs-muted">Restricted. Authentication required.</p>
      </div>
      <form class="gs-form" action="https://admin.goldshore.ai/login" method="POST">
        <label class="gs-label">Email</label>
        <input class="gs-input" name="email" type="email" autocomplete="email" required />
        <label class="gs-label">Password</label>
        <input class="gs-input" name="password" type="password" autocomplete="current-password" required />
        <button class="gs-button gs-button-solid" type="submit">Login</button>
      </form>
      <div class="gs-micro gs-muted">If you are not authorized, this will fail silently.</div>
    `;
  }

  return `
    <div class="gs-modal-head">
      <div class="gs-kicker">Signal Brief</div>
      <h2 class="gs-modal-title gs-display">Subscribe</h2>
      <p class="gs-muted">Periodic updates on releases, systems, and operational tooling.</p>
    </div>
    <form class="gs-form" action="/api/subscribe" method="POST">
      <label class="gs-label">Email</label>
      <input class="gs-input" name="email" type="email" autocomplete="email" required />
      <button class="gs-button gs-button-solid" type="submit">Request Access</button>
      <div class="gs-micro gs-muted">No spam. No public list. Controlled distribution.</div>
    </form>
  `;
}

function initParallax() {
  const root = document.documentElement;
  const hero = document.querySelector<HTMLElement>('[data-gs-hero]');
  const layers =
    hero?.querySelectorAll<HTMLElement>('[data-gs-parallax]') ?? [];
  let scrollBound = false;
  let pointerBound = false;

  let heroRect: { left: number; top: number; width: number; height: number } | null = null;

  const updateRect = () => {
    if (!hero) return;
    const r = hero.getBoundingClientRect();
    heroRect = {
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      width: r.width,
      height: r.height,
    };
  };

  const onScroll = () => {
    const y = window.scrollY || 0;
    root.style.setProperty("--gs-parallax", `${y * -0.15}px`);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const onMove = (e: PointerEvent) => {
    if (!heroRect) updateRect();
    if (!heroRect) return;

    const px = (e.pageX - heroRect.left) / heroRect.width - 0.5;
    const py = (e.pageY - heroRect.top) / heroRect.height - 0.5;

    layers.forEach((layer) => {
      const depth = Number(layer.getAttribute("data-gs-parallax")) || 1;
      const x = px * depth * 10;
      const y = py * depth * 10;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!rm) hero.addEventListener("pointermove", onMove);
  const resetParallax = () => {
    root.style.setProperty('--gs-parallax', '0px');
    layers.forEach((layer) => {
      layer.style.transform = 'translate3d(0px, 0px, 0px)';
    });
  };

  const disableParallax = () => {
    if (scrollBound) {
      window.removeEventListener('scroll', onScroll);
      scrollBound = false;
    }

    window.removeEventListener('resize', updateRect);

    if (pointerBound && hero) {
      hero.removeEventListener('pointermove', onMove);
      pointerBound = false;
    }

    resetParallax();
  };

  const enableParallax = () => {
    if (!scrollBound) {
      window.addEventListener('scroll', onScroll, { passive: true });
      scrollBound = true;
    }

    onScroll();
    window.addEventListener('resize', updateRect, { passive: true });

    if (!pointerBound && hero && layers.length) {
      hero.addEventListener('pointermove', onMove);
      pointerBound = true;
    }
  };

  syncMotion(enableParallax, disableParallax);
}

function initTilt() {
  const cards = document.querySelectorAll<HTMLElement>(".gs-tilt");
  if (!cards.length) return;

  const isFine = window.matchMedia?.("(pointer:fine)")?.matches;
  if (!isFine) return;

  const listeners = new Map<
    HTMLElement,
    {
      onMove: (e: PointerEvent) => void;
      reset: () => void;
      updateRect: () => void;
    }
  >();

  const resetTilt = () => {
    cards.forEach((el) => {
      el.style.setProperty('--tiltX', '0deg');
      el.style.setProperty('--tiltY', '0deg');
    });
  };

  const disableTilt = () => {
    cards.forEach((el) => {
      const bound = listeners.get(el);
      if (!bound) return;

      el.removeEventListener('pointermove', bound.onMove);
      el.removeEventListener('pointerleave', bound.reset);
      window.removeEventListener('resize', bound.updateRect);
      listeners.delete(el);
    });

    resetTilt();
  };

  const enableTilt = () => {
    cards.forEach((el) => {
      if (listeners.has(el)) return;

      const max = 7;
      let rafId: number | null = null;
      let pendingEvent: PointerEvent | null = null;

      const process = () => {
        if (!pendingEvent) {
          rafId = null;
          return;
        }

        const r = el.getBoundingClientRect();
        const e = pendingEvent;
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const tiltY = (px - 0.5) * (max * 2);
        const tiltX = (0.5 - py) * (max * 2);
        el.style.setProperty('--tiltX', `${tiltX.toFixed(2)}deg`);
        el.style.setProperty('--tiltY', `${tiltY.toFixed(2)}deg`);

        rafId = null;
      };

      const onMove = (e: PointerEvent) => {
        pendingEvent = e;
        if (rafId === null) {
          rafId = requestAnimationFrame(process);
        }
      };

      const reset = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        pendingEvent = null;
        el.style.setProperty('--tiltX', '0deg');
        el.style.setProperty('--tiltY', '0deg');
      };

      listeners.set(el, { onMove, reset, updateRect: () => {} });
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', reset);
    });
  };

  syncMotion(enableTilt, disableTilt);
}

function initReveal() {
  const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (rm) return;

  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-gs-reveal]"));
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          (ent.target as HTMLElement).classList.add("is-in");
          io.unobserve(ent.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  els.forEach((el) => io.observe(el));
}


function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function onReducedMotionChange(cb: (reduce: boolean) => void) {
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.addEventListener("change", (e) => cb(e.matches));
}

function syncMotion(enable: () => void, disable: () => void) {
  const sync = (reduceMotion: boolean) => {
    if (reduceMotion) {
      disable();
    } else {
      enable();
    }
  };

  sync(prefersReducedMotion());
  onReducedMotionChange(sync);
}
