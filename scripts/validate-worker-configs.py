#!/usr/bin/env python3
"""Validate wrangler.toml files used by deployable workers."""

from __future__ import annotations

import sys
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover
    print("tomllib unavailable. Python 3.11+ is required.")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]


def find_wrangler_files() -> list[Path]:
    matches = sorted(
        {
            *ROOT.glob("apps/**/wrangler.toml"),
            *ROOT.glob("infra/cloudflare/*.wrangler.toml"),
        }
    )
    return [path for path in matches if path.is_file()]


def required_keys(config: dict[str, object], path: Path) -> set[str]:
    keys = {"name"}

    # Worker-style wrangler configs should define compatibility_date.
    if path.parts[0] == "apps" or "main" in config:
        keys.add("compatibility_date")

    return keys


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []

    try:
        raw = path.read_bytes()
        config = tomllib.loads(raw.decode("utf-8"))
    except Exception as exc:
        return [f"{path.relative_to(ROOT)}: parse error: {exc}"]

    missing = sorted(required_keys(config, path) - set(config.keys()))
    if missing:
        errors.append(
            f"{path.relative_to(ROOT)}: missing required keys: {', '.join(missing)}"
        )

    routes = config.get("routes")
    workers_dev = config.get("workers_dev")
    if (path.parts[0] == "apps" or "main" in config) and not routes and workers_dev is False:
        errors.append(
            f"{path.relative_to(ROOT)}: workers_dev=false requires at least one route"
        )

    return errors


def main() -> int:
    files = find_wrangler_files()

    if not files:
        print("No wrangler.toml files found.")
        return 1

    all_errors: list[str] = []
    for file in files:
        all_errors.extend(validate_file(file))

    if all_errors:
        print("Worker configuration validation failed:")
        for item in all_errors:
            print(f"- {item}")
        return 1

    print(f"Validated {len(files)} wrangler config files successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
