1. Required Status Checks (Main Branch)

Check Name	Purpose	Wave
lockfile-guard	Prevent lockfile drift	1
validate:structure	Enforce worker contract	1
build	Ensure compilation integrity	1
lint	Code hygiene	2
test	Behavioral safety	2
concurrency guard	Prevent parallel deploy mutation	2
workspace-contract	Prevent naming drift	3
worker-name-validator	Prevent rename mismatch	3


⸻

2. CI Workflow Responsibilities

Lockfile Guard

File: .github/workflows/lockfile-guard.yml
Fails if:
	•	pnpm-lock.yaml changes in PR.

⸻

Structure Validator

Script: validate-worker-structure.ts
Fails if:
	•	Missing wrangler.toml
	•	Name mismatch with folder
	•	Missing canonical worker

⸻

Build Gate

Runs:

pnpm install
pnpm build

Fails if:
	•	Missing imports
	•	Duplicate script keys
	•	Type errors

⸻

Concurrency Guard

Add to deploy workflows:

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

Prevents:
	•	Simultaneous deploy mutations
	•	State race conditions

⸻

Workspace Contract Validator

Ensures:
	•	Apps named gs-*
	•	Workers include wrangler.toml
	•	No root app-specific scripts

⸻

3. CI Execution Order
	1.	Install
	2.	Structure validation
	3.	Worker-name validation
	4.	Build
	5.	Lint
	6.	Test
	7.	Deploy (if applicable)

Validation must fail early.
