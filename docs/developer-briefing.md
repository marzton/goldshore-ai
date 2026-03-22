# GoldShore Website Developer Briefing

## Rollout controls

Feature toggles and CTA labels are defined in `src/data/site-config.json`.

## How to edit hero copy

Update the hero section in `src/pages/index.astro`.

- Primary statement and supporting sub-text live in the first `<section>` block.
- CTA button labels are sourced from `site-config.json`.

## How to add case studies

Case studies are defined in `src/data/site-content.ts` under `caseStudies`.

Each record includes:

- `service`
- `outcome`
- `result`
- `technology`

The list renders on `src/pages/services.astro`.

## How to update services

Service panels are defined in `src/data/site-content.ts` under `services`.

Each service includes:

- `name`
- `objective`
- `deliverables[]`
- `timeframe`

The UI is rendered as expandable `<details>` panels on `src/pages/services.astro`.
