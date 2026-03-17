# GitHub Pages startup failure playbook

If the **pages build and deployment** workflow fails with an error similar to:

- `actions/checkout@v4, actions/jekyll-build-pages@v1, actions/upload-pages-artifact@v3, and actions/deploy-pages@v4 are not allowed...`

the repository is trying to use GitHub Pages Actions that conflict with this org's Actions policy.

## Resolution

1. Open **Settings → Pages** for the repository.
2. Under **Build and deployment**, disable GitHub Pages for this repo (or switch to branch deploy if required).
3. Keep deployments on the existing Cloudflare workflows (`deploy-gs-web`, `deploy-gs-admin`, previews).

## Why this happens

The org policy only allows tightly controlled actions usage. GitHub's default Pages workflow relies on the `actions/*` Pages action set, which may be blocked by policy.
