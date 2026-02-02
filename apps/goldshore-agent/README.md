# apps/goldshore-agent

## Overview
`apps/goldshore-agent` is a deprecated placeholder. The agent worker was renamed to `gs-agent`, and the legacy Wrangler config lives in `infra/cloudflare/goldshore-agent.wrangler.toml` to keep older workflows working.

## Routes/Endpoints
- None (deprecated).

## Local Dev
- No local dev scripts exist in this directory. Use `apps/gs-agent` with the legacy config if needed.

## Deploy
- Deploy the `gs-agent` worker using the legacy config (`infra/cloudflare/goldshore-agent.wrangler.toml`) if a workflow still references this path.
