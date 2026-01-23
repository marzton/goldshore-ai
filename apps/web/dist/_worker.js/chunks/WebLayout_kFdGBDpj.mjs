globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, s as spreadAttributes, u as unescapeHTML, a as renderTemplate, r as renderComponent, d as createAstro, f as renderSlot, m as maybeRenderHead, b as addAttribute, e as renderScript, p as renderHead } from './astro/server_huQWE6bd.mjs';
/* empty css                          */

function createSvgComponent({ meta, attributes, children }) {
  const Component = createComponent((_, props) => {
    const normalizedProps = normalizeProps(attributes, props);
    return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const logo = createSvgComponent({"meta":{"src":"/_astro/logo.BT6EfVX3.svg","width":160,"height":160,"format":"svg"},"attributes":{"viewBox":"0 0 160 160","role":"img","aria-labelledby":"title desc"},"children":"\n  <title id=\"title\">Penrose Triangle Logo</title>\n  <desc id=\"desc\">Interlocking triangular mark used for the GoldShore identity.</desc>\n  <defs>\n    <linearGradient id=\"penroseStroke\" x1=\"0%\" x2=\"100%\" y1=\"0%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#4f8cff\" />\n      <stop offset=\"45%\" stop-color=\"#2d6ce8\" />\n      <stop offset=\"100%\" stop-color=\"#1c52c8\" />\n    </linearGradient>\n    <linearGradient id=\"penroseFill\" x1=\"10%\" x2=\"90%\" y1=\"10%\" y2=\"90%\">\n      <stop offset=\"0%\" stop-color=\"#0f2b57\" />\n      <stop offset=\"60%\" stop-color=\"#123a7a\" />\n      <stop offset=\"100%\" stop-color=\"#0c1f3f\" />\n    </linearGradient>\n  </defs>\n  <g fill=\"url(#penroseFill)\" stroke=\"url(#penroseStroke)\" stroke-width=\"14\" stroke-linejoin=\"round\">\n    <path d=\"M80 14 18 122h48l31-54-29-54Z\" />\n    <path d=\"m83 146 62-108-23-4-31 54 12 58Z\" />\n    <path d=\"M46 131h94l-12-21H65l-19 21Z\" />\n  </g>\n"});

const $$Astro$6 = createAstro();
const $$Button = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Button;
  const { kind = "primary", size = "md", href, class: className, ...attrs } = Astro2.props;
  const Tag = href ? "a" : "button";
  const variantClass = {
    primary: "",
    secondary: "gs-button--secondary",
    destructive: "gs-button--destructive",
    ghost: "gs-button--ghost"
  }[kind] ?? "";
  const sizeClass = size === "sm" ? "gs-button--small" : size === "lg" ? "gs-button--large" : "";
  return renderTemplate`${renderComponent($$result, "Tag", Tag, { "class": `gs-button ${variantClass} ${sizeClass} ${className || ""}`.trim(), "href": href, ...attrs }, { "default": ($$result2) => renderTemplate` ${renderSlot($$result2, $$slots["default"])} ` })}`;
}, "/app/packages/ui/components/Button.astro", void 0);

const $$Astro$5 = createAstro();
const $$GSButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$GSButton;
  const {
    href,
    variant = "primary",
    disabled = false,
    loading = false,
    type = "button",
    class: className,
    ...attrs
  } = Astro2.props;
  const Tag = href ? "a" : "button";
  const variantClass = {
    primary: "",
    secondary: "gs-button--secondary",
    destructive: "gs-button--destructive",
    ghost: "gs-button--ghost"
  }[variant] ?? "";
  return renderTemplate`${renderComponent($$result, "Tag", Tag, { "href": !disabled ? href : void 0, "type": !href ? type : void 0, "class": `gs-button ${variantClass} ${className || ""}`.trim(), "disabled": disabled || loading, "aria-disabled": disabled || loading, ...attrs, "data-astro-cid-bome3wnk": true }, { "default": ($$result2) => renderTemplate`${loading && renderTemplate`${maybeRenderHead()}<span class="gs-loader" aria-hidden="true" data-astro-cid-bome3wnk></span>`}${renderSlot($$result2, $$slots["default"])} ` })} `;
}, "/app/packages/ui/GSButton.astro", void 0);

createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="gs-card"> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/app/packages/ui/components/Card.astro", void 0);

createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="gs-panel"> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/app/packages/ui/components/Panel.astro", void 0);

const $$Astro$4 = createAstro();
const $$Badge = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Badge;
  const { color = "cyan" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<span${addAttribute(`gs-badge ${color}`, "class")} data-astro-cid-zwpynmkc> ${renderSlot($$result, $$slots["default"])} </span> `;
}, "/app/packages/ui/components/Badge.astro", void 0);

const $$Astro$3 = createAstro();
const $$Table = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Table;
  const { ariaLabel = "Data table" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="gs-table-container" role="region"${addAttribute(ariaLabel, "aria-label")} tabindex="0" data-astro-cid-xr4epxya> <table class="gs-table" data-astro-cid-xr4epxya> ${renderSlot($$result, $$slots["default"])} </table> </div> `;
}, "/app/packages/ui/components/Table.astro", void 0);

const $$Astro$2 = createAstro();
const $$Tabs = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Tabs;
  const { tabs = [] } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="gs-tabs" data-astro-cid-7ftx5fxd> <div class="gs-tabs-header" role="tablist" data-astro-cid-7ftx5fxd> ${tabs.map((t) => renderTemplate`<button class="gs-tab-trigger"${addAttribute(t.id, "data-target")} role="tab" aria-selected="false"${addAttribute(t.id, "aria-controls")} data-astro-cid-7ftx5fxd> ${t.label} </button>`)} </div> <div class="gs-tab-content" data-astro-cid-7ftx5fxd> ${renderSlot($$result, $$slots["default"])} </div> </div> ${renderScript($$result, "/app/packages/ui/components/Tabs.astro?astro&type=script&index=0&lang.ts")} `;
}, "/app/packages/ui/components/Tabs.astro", void 0);

const $$Astro$1 = createAstro();
const $$Skeleton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Skeleton;
  const { width = "100%", height = "1rem" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="gs-skeleton"${addAttribute(`width: ${width}; height: ${height};`, "style")} data-astro-cid-zlbuferi></div> `;
}, "/app/packages/ui/components/Skeleton.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$WebLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$WebLayout;
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/team", label: "Team" },
    { href: "/contact", label: "Contact" },
    { href: "/apps/risk-radar", label: "Risk Radar" }
  ];
  const { title = "GoldShore", description = "GoldShore AI", currentPath = Astro2.url.pathname } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>', '</title><meta name="description"', '><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0"><link rel="stylesheet" href="https://unpkg.com/aria-icons@1.0.0/aria-icons.css">', '</head> <body> <a href="#content" class="skip-link">Skip to content</a> <div class="gs-page-shell"> <header class="gs-header" data-menu-open="false"> <a class="gs-logo" href="/" aria-label="GoldShore home"> <img', ' alt="GoldShore Penrose logo" width="36" height="36" fetchpriority="high"> <span>GoldShore</span> </a> <button class="gs-nav-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation"> <span class="material-symbols-rounded" aria-hidden="true">menu</span> <span class="sr-only">Toggle menu</span> </button> <nav class="gs-nav" id="primary-navigation" aria-label="Primary"> ', " ", ' </nav> </header> <main id="content" class="gs-page-content"> ', ' </main> <footer class="gs-footer"> <div class="gs-section gs-section--padded"> <div class="gs-grid columns-2"> <div> <div class="gs-logo" style="gap: var(--gs-space-2);"> <img', ' alt="GoldShore logo" width="32" height="32" loading="lazy" decoding="async"> <span>GoldShore AI</span> </div> <p>Applied intelligence, resilient infrastructure, and responsive operations.</p> </div> <div class="gs-grid columns-2" style="gap: var(--gs-space-2);"> <div class="gs-nav gs-nav--vertical"> <strong><span class="aria-icon aria-icon-orbit" aria-hidden="true"></span>Company</strong> <a href="/about"', '>About</a> <a href="/team"', '>Team</a> <a href="/services"', '>Services</a> </div> <div class="gs-nav gs-nav--vertical-support"> <strong><span class="aria-icon aria-icon-signal" aria-hidden="true"></span>Support</strong> <a href="/contact"', '>Contact</a> <a href="/legal/privacy"', '>Privacy</a> <a href="/legal/terms"', ">Terms</a> </div> </div> </div> </div> </footer> </div> <script>\n      const header = document.querySelector('.gs-header');\n      const toggle = document.querySelector('.gs-nav-toggle');\n      const updateHeaderOpacity = () => {\n        if (!header) return;\n        const maxScroll = 160;\n        const progress = Math.min(window.scrollY / maxScroll, 1);\n        const eased = 1 - Math.pow(1 - progress, 3);\n        header.style.setProperty('--gs-header-opacity', (0.6 * eased).toFixed(3));\n        header.classList.toggle('is-scrolled', progress > 0.02);\n      };\n      updateHeaderOpacity();\n      window.addEventListener('scroll', updateHeaderOpacity, { passive: true });\n      toggle?.addEventListener('click', () => {\n        if (!header) return;\n        const isOpen = header.getAttribute('data-menu-open') === 'true';\n        header.setAttribute('data-menu-open', String(!isOpen));\n        toggle.setAttribute('aria-expanded', String(!isOpen));\n      });\n    <\/script> </body> </html>"])), title, addAttribute(description, "content"), renderHead(), addAttribute(logo, "src"), navLinks.map((link) => renderTemplate`<a${addAttribute(link.href, "href")}${addAttribute(currentPath === link.href ? "page" : void 0, "aria-current")} data-astro-prefetch> ${link.label} </a>`), renderComponent($$result, "GSButton", $$GSButton, { "href": "/developer", "variant": "secondary", "class": "gs-button--small gs-button--with-icon" }, { "default": ($$result2) => renderTemplate` <span class="material-symbols-rounded" aria-hidden="true">terminal</span>
Developer
` }), renderSlot($$result, $$slots["default"]), addAttribute(logo.src, "src"), addAttribute(currentPath === "/about" ? "page" : void 0, "aria-current"), addAttribute(currentPath === "/team" ? "page" : void 0, "aria-current"), addAttribute(currentPath === "/services" ? "page" : void 0, "aria-current"), addAttribute(currentPath === "/contact" ? "page" : void 0, "aria-current"), addAttribute(currentPath === "/legal/privacy" ? "page" : void 0, "aria-current"), addAttribute(currentPath === "/legal/terms" ? "page" : void 0, "aria-current"));
}, "/app/apps/web/src/layouts/WebLayout.astro", void 0);

export { $$GSButton as $, $$WebLayout as a };
