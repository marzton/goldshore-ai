# Hostname Reference (Canonical)

This file is the shared source of truth for canonical preview and production hostnames.

If a service intentionally supports aliases, list them in the **Secondary/Alias** column and keep the canonical value in the first column.

| Surface | Preview (Canonical) | Production (Canonical) | Secondary/Alias Hostnames | Notes |
|---|---|---|---|---|
| Gateway (`gs-gateway`) | `gw-preview.goldshore.ai` | `gw.goldshore.ai` | `gateway-preview.goldshore.ai`, `gateway.goldshore.ai`, `agent.goldshore.ai` | Keep `gw*` names canonical for docs and new integrations. |
| API (`gs-api`) | `api-preview.goldshore.ai` | `api.goldshore.ai` | None | Used by gateway `API_ORIGIN` vars. |
| Web (`gs-web`) | `preview.goldshore.ai` | `goldshore.ai` (`www.goldshore.ai`) | Branch previews (`*-preview.goldshore.ai`, `*.goldshore-pages.dev`) | Preview should remain Access protected. |
| Admin (`gs-admin`) | `admin-preview.goldshore.ai` | `admin.goldshore.ai` | Branch previews (`*-preview.goldshore.ai`, `*.goldshore-pages.dev`) | Admin is Access protected in preview and prod. |
| Ops / Control (`gs-control`) | `ops-preview.goldshore.ai` | `ops.goldshore.ai` (`control.goldshore.ai`) | None | Internal/operations traffic only. |
