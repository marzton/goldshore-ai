Gold Shore Monorepo Stabilization Roadmap

Status: Active
Mode: Controlled Enforcement
Scope: Structural & CI Stabilization
Philosophy: Stability precedes refactor

⸻

0. Guiding Principles
	1.	Do not refactor architecture during containment.
	2.	Guards must not be weakened to satisfy failing builds.
	3.	Structural drift is fixed — not tolerated.
	4.	Root surface area must shrink over time.
	5.	Merges must become deterministic before innovation resumes.

⸻

1. Wave Overview

Wave	Name	Goal	Status
1	Structural Containment	Stop drift	In Progress
2	Merge Determinism	Stabilize CI & history	Pending
3	Root Surface Freeze	Reduce global mutation	Pending
4	Infra Locality	Remove shared deploy mutation	Pending
5	Dependency Hardening	Reduce cross-app breakage	Pending
6	Drift Monitoring	Detect regression early	Pending
7	Strategic Refactor (Optional)	Long-term evolution	Deferred


⸻

2. Wave 1 — Structural Containment

Objective

Eliminate rename drift, infra duplication, and lockfile churn.

Controls Introduced
	•	Lockfile Guard (.github/workflows/lockfile-guard.yml)
	•	Worker Structure Validator (validate-worker-structure.ts)
	•	Canonical worker folders:
	•	gs-api
	•	gs-control
	•	gs-gateway
	•	gs-agent
	•	gs-mail
	•	Removal of legacy *-worker directories

Requirements
	•	Each canonical worker must contain:
	•	wrangler.toml
	•	Name matching folder
	•	No duplicate worker folders
	•	No lockfile modification outside controlled PR

Exit Criteria
	•	pnpm validate:structure passes
	•	pnpm build passes
	•	CI green
	•	No duplicate root script keys
	•	No orphan worker folders

Explicit Non-Goals
	•	No deploy refactors
	•	No workspace splitting
	•	No infra redesign

⸻

3. Wave 2 — Merge Determinism & CI Discipline

Objective

Eliminate merge unpredictability and CI race conditions.

Controls To Introduce

3.1 Linear History Enforcement
	•	Require linear history
	•	Disable merge commits
	•	Allow squash only
	•	No direct pushes to main

3.2 Document Conflict Neutralization

Add to .gitattributes:

README.md merge=ours
README-v2.md merge=ours
CURRENT_MONOREPO_STATE.md merge=ours
reports/* merge=ours

Generated artifacts must never block merges.

3.3 CI Concurrency Guard

Add to deploy workflows:

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

3.4 Required Status Checks

Main branch must require:
	•	Lockfile guard
	•	Structure validator
	•	Build
	•	Lint
	•	Test

Exit Criteria
	•	5 consecutive merges without conflict
	•	No CI race-condition failures
	•	No docs blocking merges

⸻

4. Wave 3 — Root Surface Freeze

Objective

Minimize global mutation surface.

Target Root package.json State

Allowed scripts:

dev
build
lint
test
validate

Remove:
	•	build:gs-*
	•	deploy:*
	•	app-specific orchestration
	•	ad-hoc scripts

Each app owns its own build/deploy logic.

Additional Controls
	•	Workspace contract validator
	•	Worker name validator
	•	Required files per app:
	•	package.json
	•	wrangler.toml (workers only)
	•	tsconfig.json

Exit Criteria
	•	Root file changes rare
	•	App-level PRs do not modify root
	•	Root script conflicts drop significantly

⸻

5. Wave 4 — Infrastructure Locality

Objective

Remove shared deployment mutation.

Actions
	•	Remove infra/cloudflare/*
	•	Each worker owns:
	•	Its own wrangler.toml
	•	Its own deploy script
	•	Its own bindings
	•	Split deploy workflows per app
	•	Remove shared deploy matrices touching multiple apps

Exit Criteria
	•	Independent deploy pipelines
	•	No shared infra config
	•	No cross-app deploy breakage

⸻

6. Wave 5 — Dependency & Package Hardening

Objective

Reduce cross-app breakage caused by shared config mutation.

Actions
	•	Convert shared config into pure factories
	•	Eliminate shared mutable config files
	•	Lock dependency versions
	•	Normalize TypeScript configs
	•	Remove implicit cross-imports between apps

Exit Criteria
	•	Updating one worker does not break others
	•	Dependency bumps isolated to single app when possible

⸻

7. Wave 6 — Drift Monitoring

Objective

Make structural regressions visible immediately.

Controls
	•	Nightly structure validation
	•	Worker-name audit job
	•	Workspace contract audit
	•	Environment binding verification
	•	Dependency drift scan

Exit Criteria
	•	Structural drift detected before merge
	•	No silent config regressions

⸻

8. Wave 7 — Strategic Refactor (Optional)

Precondition

Must meet:
	•	30 days of stable merges
	•	No structural regressions
	•	CI deterministic

Potential Actions
	•	Split workers into separate repositories
	•	Introduce versioned internal packages
	•	Modular release tagging
	•	Advanced deployment orchestration

This wave is optional and only considered after prolonged stability.

⸻

9. Enforcement Discipline

The following rule is absolute:

No new architectural refactor until main remains green for 5 consecutive merges.

Stability precedes ambition.

⸻

10. Current Position

Wave 1: In Progress
Blocking items:
	•	Build must pass
	•	Root script duplication must be resolved

No advancement to Wave 2 until Wave 1 exit criteria satisfied.

⸻

11. Change Control Rule

Each wave must be executed in separate PR layers.

Do not:
	•	Combine waves
	•	Bundle structural changes with refactors
	•	Modify CI and architecture in the same PR

Containment first. Evolution second.

⸻

12. Owner

Gold Shore Engineering Control Layer
