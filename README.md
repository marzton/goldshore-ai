# GoldShore Monorepo

This is the official pnpm-based monorepo for the GoldShore organization. It contains all the applications, shared packages, and infrastructure configurations.

## Structure

The monorepo is organized into the following workspaces:

- **`apps/`**: Contains the individual, deployable applications.
  - `goldshore-web`: The main public-facing Astro website and user portal.
  - `goldshore-admin`: The Astro-based administration dashboard.
  - `goldshore-api`: A Hono-based API running on Cloudflare Workers.
  - `goldshore-agent`: A Cloudflare Worker for background jobs and queue processing.

- **`packages/`**: Contains shared code and configurations used across different applications.
  - `ui`: Shared UI components, design tokens, and styles.
  - `config`: Shared configurations for tools like ESLint and TypeScript.
  - `utils`: Shared TypeScript utility functions.
  - `auth`: Helpers for Cloudflare Access authentication and authorization.

- **`infra/`**: Contains infrastructure-as-code and deployment configurations.
  - `cloudflare`: Per-environment `wrangler.toml` files for Cloudflare Workers and Pages Functions bindings.
  - `github`: GitHub Actions workflows for CI/CD.

## Getting Started

1.  **Install Tools**: Ensure you have `asdf` or a similar tool installed to manage runtime versions. The required version of `nodejs` is specified in the `.tool-versions` file. The repository declares its `pnpm` version via the `packageManager` field in `package.json`, so you can run `corepack use pnpm@8.15.5` (or `corepack enable`) after installing Node.
2.  **Install Dependencies**: Run the following command from the root of the monorepo to install all dependencies for all workspaces:
    ```bash
    pnpm install
    ```

## Core Commands

All commands should be run from the root of the monorepo.

- **`pnpm dev`**: Starts the development server for all applications in parallel.
- **`pnpm build`**: Builds all applications for production.
- **`pnpm preview`**: Previews the production build of all applications.
- **`pnpm deploy`**: Deploys all applications (this is typically handled by CI/CD).
- **`pnpm lint`**: Lints the entire codebase.
- **`pnpm format`**: Formats the entire codebase using Prettier.

- **`pnpm check:conflicts`**: Detects unresolved Git merge conflict markers in tracked files.
- **`pnpm audit:mergeable`**: Fetches remote refs and audits whether each remote branch is already merged, cleanly mergeable, or conflict-prone against `origin/main` (override target/remote via script args).

## Deployment

Deployments are automated via GitHub Actions, defined in the `infra/github/workflows` directory. The workflows will deploy the applications to Cloudflare Pages and Workers based on the branch and environment.
