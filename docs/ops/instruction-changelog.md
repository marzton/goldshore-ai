# Instruction Changelog

## 2026-02-11

- Added a canonical precedence model in `docs/ops/instruction-governance.md` to resolve conflicts between root instructions, SOPs, and templates.
- Added `docs/ops/instruction-manifest.json` as the machine-readable inventory for `.jules/`, optional `.codex/`, and instruction documents.
- Added `scripts/validate_instruction_refs.py` to validate instruction file existence, reference validity, and PR template guardrails.
- Updated PR templates to require issue context and explicit review-tag selection when review escalation applies.
- Marked legacy agent rule docs as non-authoritative and redirected to the canonical governance model.
