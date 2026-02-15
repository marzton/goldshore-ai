Column: Wave 1 – Containment

TODO
	•	Fix duplicate root script keys
	•	Resolve build failures in gs-control
	•	Confirm canonical workers exist
	•	Confirm no legacy *-worker directories

DOING
	•	Worker contract enforcement

DONE
	•	Lockfile guard
	•	Structure validator
	•	Canonical folder normalization

⸻

Column: Wave 2 – Merge Discipline

TODO
	•	Add .gitattributes
	•	Add concurrency guards
	•	Enable linear history
	•	Require status checks

⸻

Column: Wave 3 – Root Surface Freeze

TODO
	•	Remove app-specific scripts from root
	•	Introduce workspace contract validator
	•	Freeze root script surface

⸻

Column: Wave 4 – Infra Locality

TODO
	•	Remove shared infra configs
	•	Split deploy workflows per app
	•	Validate binding locality

⸻

Column: Wave 5 – Dependency Hardening

TODO
	•	Convert shared config to factories
	•	Lock dependency versions
	•	Normalize TS configs

⸻

Column: Wave 6 – Drift Monitoring

TODO
	•	Nightly structure validation
	•	Worker audit job
	•	Dependency drift scan

⸻

Column: Wave 7 – Strategic Refactor (Optional)

BLOCKED

Requires:
	•	30 days stable merges
	•	0 structural regressions

⸻

Operational Rule

Only move tasks rightward when exit criteria are satisfied.

No cross-wave mixing.

⸻

Current Priority

You are still in:

Wave 1 — Containment

Your only mission:
	•	Fix build
	•	Confirm structure passes
	•	Merge cleanly

Do not advance prematurely.
