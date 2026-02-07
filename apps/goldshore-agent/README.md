# apps/goldshore-agent

## Overview
`apps/goldshore-agent` is a deprecated placeholder kept in sync with `apps/gs-agent` for legacy workflows. The agent worker was renamed to `gs-agent`, and the legacy Wrangler config lives in `infra/cloudflare/goldshore-agent.wrangler.toml` to keep older workflows working.

## Routes/Endpoints
- None (deprecated).

## Local Dev
- Use `apps/gs-agent` for active development. Scripts in this directory are retained only for legacy workflows and should not be used for new work.

## Deploy
- Deploy the `gs-agent` worker using the legacy config (`infra/cloudflare/goldshore-agent.wrangler.toml`) if a workflow still references this path.
