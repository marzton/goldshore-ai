globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderComponent, a as renderTemplate, d as createAstro, m as maybeRenderHead } from '../chunks/astro/server_huQWE6bd.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_BK05sYKf.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$DefaultPageTemplate = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$DefaultPageTemplate;
  const { path = Astro2.url.pathname } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Page Not Found | GoldShore" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="max-w-4xl mx-auto py-24 px-6 text-center"> <h1 class="text-4xl gs-heading mb-6" style="color: var(--gs-brand-gold);">Page Not Found</h1> <p class="text-lg text-[var(--gs-text-secondary)] mb-8">
We can't find the page you're looking for at: <code class="bg-[var(--gs-surface)] px-2 py-1 rounded text-[var(--gs-text-primary)]">${path}</code> </p> <p class="text-[var(--gs-text-secondary)]">
Please check the URL or navigate back to the <a href="/" class="text-[var(--gs-brand-gold)] hover:underline">GoldShore Home Page</a>.
</p> </section> ` })}`;
}, "/app/apps/web/src/components/DefaultPageTemplate.astro", void 0);

const prerender = false;
const $$ = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "DefaultPageTemplate", $$DefaultPageTemplate, {})}`;
}, "/app/apps/web/src/pages/[...path].astro", void 0);

const $$file = "/app/apps/web/src/pages/[...path].astro";
const $$url = "/[...path]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
