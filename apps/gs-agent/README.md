# @goldshore/agent (apps/gs-agent)

## Overview

Autonomous AI Agent Service running on Cloudflare Workers. Handles background reasoning tasks, integrations, and workflow orchestration.

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/gs-agent dev
```

Build or deploy:

```bash
pnpm --filter ./apps/gs-agent build
pnpm --filter ./apps/gs-agent deploy
```

## Configuration

Wrangler configuration lives in:

```
infra/cloudflare/gs-agent.wrangler.toml
```
