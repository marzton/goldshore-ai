# Project Sentinel: RKLB Gravitational Radar

## Operational Philosophy
This is an Infrastructure-Grade instrument. It does not "notify"; it "visualizes atmospheric pressure" around the RKLB position.

## Technical Specs
- **Interval:** 2.4s Gravitational Ripple.
- **Latency Target:** < 28ms via Supabase Edge Functions.
- **Visual Posture:** Monochrome / High-Contrast / All-Caps Wide.

## Conflict Resolution
Prioritize `globals.css` overrides. If a component introduces "Blue" or "Soft Corners," the build must fail.
