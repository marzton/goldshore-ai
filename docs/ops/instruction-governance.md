# Instruction Governance

## Purpose

This document defines the canonical instruction model for human and bot contributors, including how instruction files are inventoried, interpreted, and validated.

## Inventory

### Agent workspaces

- `.jules/` exists and is used for journals, verification artifacts, and guard reports.
- `.codex/` is currently optional and may be absent in some clones.

### Instruction sources

The canonical instruction inventory is machine-readable in `docs/ops/instruction-manifest.json`.

## Precedence model (single source of truth)

When multiple instruction documents overlap, use this order:

1. Direct system/developer/user directives.
2. `AGENTS.md` at repository root (global defaults).
3. Scoped instruction docs in their own areas (`docs/ops/DEVELOPER_SOP.md`, `ops/pr-playbook.md`).
4. Operational templates (PR templates and playbook templates).
5. Historical or archived agent notes (`AI/`, `.jules/journal/`) for context only.

If an instruction conflicts with a higher-priority source, the higher-priority source wins.

## De-duplication policy

- Tagging requirements are defined once in `AGENTS.md` and consumed by templates.
- SOP procedure details live in SOP/playbook documents and should not be restated in archival agent docs.
- Historical rule files must explicitly declare themselves non-authoritative when they diverge.

## Validation

Run the validator whenever instruction docs or templates change:

```bash
python scripts/validate_instruction_refs.py
```

The validator checks for:

- missing instruction files listed in the manifest,
- invalid cross-file references,
- bot PR templates missing issue context and review-tag prompts.

## Change tracking

Any behavior change to instruction precedence, template requirements, or validation rules must add an entry to:

- `docs/ops/instruction-changelog.md`.
