Main Branch Rules

Enable:
	•	Require pull request before merging
	•	Require status checks to pass
	•	Require branches up to date before merging
	•	Require linear history
	•	Require signed commits (optional but recommended)
	•	Include administrators

Disable:
	•	Allow merge commits
	•	Allow rebase merges (optional, but squash-only preferred)
	•	Direct pushes to main

⸻

Required Status Checks

Select:
	•	lockfile-guard
	•	validate:structure
	•	build
	•	lint
	•	test

Deploy checks optional depending on environment.

⸻

Repository Settings

Enable:
	•	Branch protection on main
	•	Automatic PR branch deletion after merge
	•	Dependency vulnerability alerts
	•	Secret scanning

⸻

Pull Request Rules

Require:
	•	At least 1 approval
	•	No self-approval
	•	No force-push after approval without re-review
