# GoldShore AI Monorepo

Welcome to the GoldShore AI monorepo. This repository houses the entire GoldShore ecosystem, including web applications, administrative tools, API services, and infrastructure code.

## 🏗️ Project Structure

We follow a strict monorepo structure managed by `pnpm` and `turbo`.

### 📱 Applications (`apps/`)

*   **[gs-web](./apps/gs-web)**: The public-facing marketing website (Astro).
*   **[gs-admin](./apps/gs-admin)**: The secure administrative dashboard (Astro).
*   **[gs-api](./apps/gs-api)**: The core API logic (Cloudflare Worker).
*   **[gs-gateway](./apps/gs-gateway)**: The API Gateway routing traffic to services (Cloudflare Worker).
*   **[gs-control](./apps/gs-control)**: Internal operational automation and scheduled tasks (Cloudflare Worker).
*   **[gs-agent](./apps/gs-agent)**: AI Agent worker for autonomous tasks (Cloudflare Worker).

### 📦 Packages (`packages/`)

*   **[@goldshore/ui](./packages/ui)**: Shared Astro UI component library.
*   **[@goldshore/theme](./packages/theme)**: Design tokens, CSS variables, and tailwind config.
*   **[@goldshore/utils](./packages/utils)**: Shared utility functions and helpers.
*   **[@goldshore/auth](./packages/auth)**: Authentication and authorization logic.
*   **[@goldshore/config](./packages/config)**: Shared configuration (Astro, TypeScript, etc.).
*   **[@goldshore/schema](./packages/schema)**: Shared Zod schemas and type definitions.

### 🏗️ Infrastructure (`infra/`)

*   **[cloudflare](./infra/cloudflare)**: Cloudflare configuration and runbooks.
*   **[cron](./infra/cron)**: Scheduled task definitions.

## 🚀 Getting Started

### Prerequisites

*   Node.js v20+
*   pnpm v9+

### Installation

```bash
pnpm install
```

### Development

To start all applications in development mode:

```bash
pnpm dev
```

To work on a specific application (e.g., gs-web):

```bash
pnpm --filter gs-web dev
```

## 🛠️ Tooling

*   **Build System**: [Turborepo](https://turbo.build/)
*   **Package Manager**: [pnpm](https://pnpm.io/)
*   **Framework**: [Astro](https://astro.build/) (Web, Admin)
*   **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (API, Gateway, Control, Agent)

## 🤝 Contributing

Please read [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) (coming soon) for details on our code of conduct and the process for submitting pull requests.

## 📄 Documentation

*   [Naming Conventions](./docs/NAMING_CONVENTIONS.md)
*   [Branching Strategy](./CONSOLIDATION_STRATEGY.md)
