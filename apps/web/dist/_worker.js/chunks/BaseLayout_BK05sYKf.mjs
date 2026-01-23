globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, r as renderComponent, a as renderTemplate, d as createAstro, f as renderSlot } from './astro/server_huQWE6bd.mjs';
import { a as $$WebLayout } from './WebLayout_kFdGBDpj.mjs';

const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title, description } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "WebLayout", $$WebLayout, { "title": title, "description": description }, { "default": ($$result2) => renderTemplate` ${renderSlot($$result2, $$slots["default"])} ` })}`;
}, "/app/apps/web/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
