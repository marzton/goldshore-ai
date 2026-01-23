globalThis.process ??= {}; globalThis.process.env ??= {};
import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_9Ta2C68D.mjs';
import { manifest } from './manifest_D3ZUkGmz.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/docs-search.astro.mjs');
const _page3 = () => import('./pages/app/dashboard.astro.mjs');
const _page4 = () => import('./pages/app/logs.astro.mjs');
const _page5 = () => import('./pages/app/profile.astro.mjs');
const _page6 = () => import('./pages/app/settings.astro.mjs');
const _page7 = () => import('./pages/contact.astro.mjs');
const _page8 = () => import('./pages/developer/api/_---slug_.astro.mjs');
const _page9 = () => import('./pages/developer/docs.astro.mjs');
const _page10 = () => import('./pages/developer/docs/_---slug_.astro.mjs');
const _page11 = () => import('./pages/developer/sdk.astro.mjs');
const _page12 = () => import('./pages/developer.astro.mjs');
const _page13 = () => import('./pages/index.legacy-20251128.astro.mjs');
const _page14 = () => import('./pages/legal/privacy.astro.mjs');
const _page15 = () => import('./pages/legal/terms.astro.mjs');
const _page16 = () => import('./pages/legal.astro.mjs');
const _page17 = () => import('./pages/pricing.astro.mjs');
const _page18 = () => import('./pages/services.astro.mjs');
const _page19 = () => import('./pages/status.astro.mjs');
const _page20 = () => import('./pages/team.astro.mjs');
const _page21 = () => import('./pages/index.astro.mjs');
const _page22 = () => import('./pages/_---path_.astro.mjs');
const pageMap = new Map([
    ["../../node_modules/.pnpm/@astrojs+cloudflare@12.6.12_@types+node@25.0.10_astro@5.16.14_@types+node@25.0.10_jiti@_e6865e302b1eacce9e923fcd9fecef96/node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/docs-search.ts", _page2],
    ["src/pages/app/dashboard.astro", _page3],
    ["src/pages/app/logs.astro", _page4],
    ["src/pages/app/profile.astro", _page5],
    ["src/pages/app/settings.astro", _page6],
    ["src/pages/contact.astro", _page7],
    ["src/pages/developer/api/[...slug].astro", _page8],
    ["src/pages/developer/docs/index.astro", _page9],
    ["src/pages/developer/docs/[...slug].astro", _page10],
    ["src/pages/developer/sdk.astro", _page11],
    ["src/pages/developer/index.astro", _page12],
    ["src/pages/index.legacy-20251128.astro", _page13],
    ["src/pages/legal/privacy.astro", _page14],
    ["src/pages/legal/terms.astro", _page15],
    ["src/pages/legal.astro", _page16],
    ["src/pages/pricing.astro", _page17],
    ["src/pages/services.astro", _page18],
    ["src/pages/status.astro", _page19],
    ["src/pages/team.astro", _page20],
    ["src/pages/index.astro", _page21],
    ["src/pages/[...path].astro", _page22]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = undefined;
const _exports = createExports(_manifest);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
