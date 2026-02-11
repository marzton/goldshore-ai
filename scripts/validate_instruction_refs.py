#!/usr/bin/env python3
"""Validate instruction inventory and references."""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/ops/instruction-manifest.json"
REVIEW_TAGS = ("[review-request]", "[error-analysis]", "[issue-repro]")


def load_manifest() -> dict:
    if not MANIFEST.exists():
        raise FileNotFoundError(f"Missing manifest: {MANIFEST}")
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def validate_manifest(data: dict) -> list[str]:
    errors: list[str] = []
    instructions = data.get("instructions", [])

    if not isinstance(instructions, list) or not instructions:
        return ["Manifest must include a non-empty 'instructions' array."]

    for entry in instructions:
        path = entry.get("path")
        optional = bool(entry.get("optional", False))
        if not isinstance(path, str) or not path:
            errors.append(f"Invalid manifest entry without a path: {entry!r}")
            continue

        target = ROOT / path
        if not target.exists() and not optional:
            errors.append(f"Missing required instruction path: {path}")

        references = entry.get("references", [])
        if not isinstance(references, list):
            errors.append(f"Invalid references list for {path}")
            continue

        for ref in references:
            if not isinstance(ref, str) or not ref:
                errors.append(f"Invalid reference value in {path}: {ref!r}")
                continue
            ref_target = ROOT / ref
            if not ref_target.exists():
                errors.append(f"Missing reference target: {path} -> {ref}")

    return errors


def validate_pr_templates(data: dict) -> list[str]:
    errors: list[str] = []

    for entry in data.get("instructions", []):
        if entry.get("type") != "pr_template":
            continue

        path = entry["path"]
        template_path = ROOT / path
        if not template_path.exists():
            errors.append(f"PR template listed but missing: {path}")
            continue

        content = template_path.read_text(encoding="utf-8").lower()

        if "issue context" not in content:
            errors.append(f"PR template missing 'Issue context' section: {path}")

        if not any(tag in content for tag in REVIEW_TAGS):
            errors.append(
                "PR template must include at least one review tag option "
                f"({', '.join(REVIEW_TAGS)}): {path}"
            )

        if "when applicable" not in content:
            errors.append(
                "PR template should state that review tags are required when applicable: "
                f"{path}"
            )

    return errors


def main() -> int:
    try:
        data = load_manifest()
    except Exception as exc:  # pragma: no cover
        print(f"ERROR: {exc}")
        return 1

    errors = []
    errors.extend(validate_manifest(data))
    errors.extend(validate_pr_templates(data))

    if errors:
        print("Instruction validation failed:")
        for err in errors:
            print(f" - {err}")
        return 1

    print("Instruction validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
