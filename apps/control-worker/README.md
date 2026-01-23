# @goldshore/control (apps/control-worker)

## Overview

Automation worker for infrastructure operations such as DNS updates, previews, and deployments.

```
Route: https://ops.goldshore.ai/*
```

## Responsibilities

- DNS updates
- Preview environment creation
- Worker deployment orchestration
- Secret rotation
- Observability sync

## Local Development

From the repo root:

```bash
pnpm --filter ./apps/control-worker dev
```

Run scheduled tasks locally:

```bash
pnpm --filter ./apps/control-worker run-task
```

Deploy:

```bash
pnpm --filter ./apps/control-worker deploy
```
