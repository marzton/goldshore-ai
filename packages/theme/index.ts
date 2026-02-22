export function initGoldShoreUI() {
  initNav();
  initModal();
  initParallax();
  initTilt();
  initReveal();
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const backgroundStates = new WeakMap<HTMLElement, { ariaHidden: string | null; inert: boolean }>();

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return el.offsetParent !== null;
  });
}

function focusFirstInteractive(container: HTMLElement) {
  const [first] = getFocusableElements(container);
  if (first) {
    first.focus();
    return;
  }

  if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "-1");
  container.focus();
}

function trapTabKey(event: KeyboardEvent, container: HTMLElement) {
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(container);
  if (!focusable.length) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function setBackgroundHidden(activeLayer: HTMLElement, open: boolean) {
  const bodyChildren = Array.from(document.body.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child !== activeLayer
  );

  bodyChildren.forEach((el) => {
    if (open) {
      backgroundStates.set(el, {
        ariaHidden: el.getAttribute("aria-hidden"),
        inert: el.hasAttribute("inert")
      });
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("inert", "");
      return;
    }

    const prev = backgroundStates.get(el);
    if (!prev) return;

    if (prev.ariaHidden === null) el.removeAttribute("aria-hidden");
    else el.setAttribute("aria-hidden", prev.ariaHidden);

    if (!prev.inert) el.removeAttribute("inert");
    backgroundStates.delete(el);
  });
}

function initNav() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-gs-nav-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-gs-mobile-panel]");
  if (!toggle || !panel) return;

  let previouslyFocused: HTMLElement | null = null;

  const setOpen = (open: boolean) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("gs-lock", open);

    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null;
      setBackgroundHidden(panel, true);
      focusFirstInteractive(panel);
      return;
    }

    setBackgroundHidden(panel, false);
    previouslyFocused?.focus();
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
    if (toggle.getAttribute("aria-expanded") === "true") trapTabKey(e, panel);
  });
}

function initModal() {
  const root = document.querySelector<HTMLElement>("[data-gs-modal]");
  if (!root) return;

  const backdrop = root.querySelector<HTMLElement>("[data-gs-modal-backdrop]");
  const closeBtn = root.querySelector<HTMLButtonElement>("[data-gs-modal-close]");
  const body = root.querySelector<HTMLElement>("[data-gs-modal-body]");
  const panel = root.querySelector<HTMLElement>("[data-gs-modal-panel]");
  let previouslyFocused: HTMLElement | null = null;

  const openModal = (html: string) => {
    if (body) body.innerHTML = html;
    const heading = body?.querySelector<HTMLElement>(".gs-modal-title");
    if (heading) heading.id = "gs-modal-title";

    root.classList.add("is-open");
    document.documentElement.classList.add("gs-lock");
    previouslyFocused = document.activeElement as HTMLElement | null;
    setBackgroundHidden(root, true);
    if (panel) focusFirstInteractive(panel);
  };

  const closeModal = () => {
    root.classList.remove("is-open");
    document.documentElement.classList.remove("gs-lock");
    setBackgroundHidden(root, false);
    previouslyFocused?.focus();
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
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (root.classList.contains("is-open") && panel) trapTabKey(e, panel);
  });
}

function getModalTemplate(variant: string): string {
  if (variant === "admin") {
    return `
      <div class="gs-modal-head">
        <div class="gs-kicker gs-signal">Secure Access</div>
        <h2 id="gs-modal-title" class="gs-modal-title gs-display">Admin Login</h2>
        <p class="gs-muted">Restricted console entry. Continue to the secure admin surface.</p>
      </div>
      <div class="gs-form">
        <a class="gs-button gs-button-solid" href="https://admin.goldshore.ai/login">Continue to Admin</a>
      </div>
      <div class="gs-micro gs-muted">Authentication is handled on the admin domain.</div>
    `;
  }

  return `
    <div class="gs-modal-head">
      <div class="gs-kicker">Signal Brief</div>
      <h2 id="gs-modal-title" class="gs-modal-title gs-display">Subscribe</h2>
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
  const onScroll = () => {
    const y = window.scrollY || 0;
    root.style.setProperty("--gs-parallax", `${y * -0.15}px`);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const hero = document.querySelector<HTMLElement>("[data-gs-hero]");
  if (!hero) return;

  const layers = hero.querySelectorAll<HTMLElement>("[data-gs-parallax]");
  if (!layers.length) return;

  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    layers.forEach((layer) => {
      const depth = Number(layer.getAttribute("data-gs-parallax")) || 1;
      const x = px * depth * 10;
      const y = py * depth * 10;
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!rm) hero.addEventListener("pointermove", onMove);
}

function initTilt() {
  const cards = document.querySelectorAll<HTMLElement>(".gs-tilt");
  if (!cards.length) return;

  const isFine = window.matchMedia?.("(pointer:fine)")?.matches;
  if (!isFine) return;

  cards.forEach((el) => {
    const max = 7;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const tiltY = (px - 0.5) * (max * 2);
      const tiltX = (0.5 - py) * (max * 2);
      el.style.setProperty("--tiltX", `${tiltX.toFixed(2)}deg`);
      el.style.setProperty("--tiltY", `${tiltY.toFixed(2)}deg`);
    };
    const reset = () => {
      el.style.setProperty("--tiltX", "0deg");
      el.style.setProperty("--tiltY", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
  });
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
