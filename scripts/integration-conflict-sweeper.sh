#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="origin/main"
INTEGRATION_BRANCH="integration/conflict-resolution/$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_PATH="ops/conflict-report.json"
SUMMARY_PATH="reports/branch-audit.md"
ALLOWLIST_PATH=""
ALLOW_DIRTY=0
DRY_RUN=0

usage() {
  cat <<'USAGE'
Usage: scripts/integration-conflict-sweeper.sh [options]

Options:
  --base <ref>           Base ref to merge onto (default: origin/main)
  --integration <name>   Integration branch name (default: integration/conflict-resolution/<timestamp>)
  --allowlist <path>     File with branch names to include (one per line)
  --report <path>        JSON report output path (default: ops/conflict-report.json)
  --summary <path>       Markdown summary output path (default: reports/branch-audit.md)
  --dry-run              Do not perform merge simulation; report metadata only
  --allow-dirty          Allow running with a dirty working tree (dry-run only)
  -h, --help             Show this help message
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_BRANCH="$2"; shift 2 ;;
    --integration)
      INTEGRATION_BRANCH="$2"; shift 2 ;;
    --allowlist)
      ALLOWLIST_PATH="$2"; shift 2 ;;
    --report)
      REPORT_PATH="$2"; shift 2 ;;
    --summary)
      SUMMARY_PATH="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    --allow-dirty)
      ALLOW_DIRTY=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1 ;;
  esac
done

if [[ -n "$(git status --porcelain)" && "$ALLOW_DIRTY" -ne 1 && "$DRY_RUN" -ne 1 ]]; then
  echo "Working tree is not clean. Please commit or stash changes before running." >&2
  exit 1
fi

export SWEEP_BASE_BRANCH="$BASE_BRANCH"
export SWEEP_INTEGRATION_BRANCH="$INTEGRATION_BRANCH"
export SWEEP_REPORT_PATH="$REPORT_PATH"
export SWEEP_SUMMARY_PATH="$SUMMARY_PATH"
export SWEEP_ALLOWLIST_PATH="$ALLOWLIST_PATH"
export SWEEP_DRY_RUN="$DRY_RUN"
export SWEEP_ALLOW_DIRTY="$ALLOW_DIRTY"

python - <<'PY'
import json
import os
import subprocess
from datetime import datetime, timezone

base = os.environ["SWEEP_BASE_BRANCH"]
integration = os.environ["SWEEP_INTEGRATION_BRANCH"]
report_path = os.environ["SWEEP_REPORT_PATH"]
summary_path = os.environ["SWEEP_SUMMARY_PATH"]
allowlist_path = os.environ["SWEEP_ALLOWLIST_PATH"]
dry_run = bool(int(os.environ["SWEEP_DRY_RUN"]))
allow_dirty = bool(int(os.environ["SWEEP_ALLOW_DIRTY"]))

now = datetime.now(timezone.utc)
head_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()


def run(cmd, check=True):
    return subprocess.run(cmd, text=True, capture_output=True, check=check)


def conflict_markers():
    proc = run(["rg", "-n", "^(<<<<<<<|=======|>>>>>>>)", "-g", "!pnpm-lock.yaml", "."], check=False)
    if proc.returncode == 1:
        return []
    if proc.returncode != 0:
        return [{"error": proc.stderr.strip() or proc.stdout.strip()}]
    results = []
    for line in proc.stdout.strip().splitlines():
        path, line_no, content = line.split(":", 2)
        results.append({"file": path, "line": int(line_no), "content": content})
    return results


def write_summary(status_line, open_conflicts_lines, next_steps):
    os.makedirs(os.path.dirname(summary_path) or ".", exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("# Branch Audit Report\n\n")
        f.write(f"- Generated at (UTC): {now.strftime('%Y-%m-%dT%H:%M:%SZ')}\n")
        f.write(f"- Source commit (local HEAD): `{head_sha}`\n")
        f.write(f"- Base ref: `{base}`\n\n")
        f.write("## Status\n\n")
        f.write(f"- {status_line}\n\n")
        f.write("## Open Conflicts\n\n")
        if open_conflicts_lines:
            for line in open_conflicts_lines:
                f.write(f"- {line}\n")
        else:
            f.write("- None detected.\n")
        f.write("\n## Next Step\n\n")
        for step in next_steps:
            f.write(f"- {step}\n")


remotes_proc = run(["git", "remote"], check=False)
has_origin = "origin" in remotes_proc.stdout.split()

fetch_ok = False
fetch_error = ""
if has_origin:
    fetch_proc = run(["git", "fetch", "--all", "--prune"], check=False)
    fetch_ok = fetch_proc.returncode == 0
    if not fetch_ok:
        fetch_error = (fetch_proc.stderr or fetch_proc.stdout).strip()

if not has_origin or not fetch_ok:
    status_reason = "no `origin` remote configured" if not has_origin else "unable to fetch `origin/*` refs"
    payload = {
        "base": base,
        "integration_branch": integration,
        "generated_at": now.isoformat(),
        "dry_run": dry_run,
        "allow_dirty": allow_dirty,
        "audit_status": "blocked",
        "audit_blockers": [status_reason] + ([fetch_error] if fetch_error else []),
        "conflict_markers": conflict_markers(),
        "branches": [],
    }
    os.makedirs(os.path.dirname(report_path) or ".", exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    write_summary(
        f"⚠️ Audit blocked: {status_reason}.",
        ["Source of truth unavailable until remote refs are accessible."],
        [
            "Configure Git credentials for the upstream repository.",
            "Run `git fetch --all --prune`.",
            "Rerun `bash scripts/integration-conflict-sweeper.sh --dry-run --allow-dirty`."
        ]
    )
    print(f"Wrote blocked reports to {report_path} and {summary_path}")
    raise SystemExit(0)

base_ref = f"refs/remotes/{base}"
if run(["git", "show-ref", "--verify", "--quiet", base_ref], check=False).returncode != 0:
    payload = {
        "base": base,
        "integration_branch": integration,
        "generated_at": now.isoformat(),
        "dry_run": dry_run,
        "allow_dirty": allow_dirty,
        "audit_status": "blocked",
        "audit_blockers": [f"base ref {base} missing after fetch"],
        "conflict_markers": conflict_markers(),
        "branches": [],
    }
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    write_summary(
        f"⚠️ Audit blocked: base ref `{base}` missing after fetch.",
        ["Cannot compute mergeability without the configured base branch."],
        ["Verify remote base branch name and rerun the sweep script."]
    )
    print(f"Wrote blocked reports to {report_path} and {summary_path}")
    raise SystemExit(0)

remote_refs_proc = run(["git", "for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"], check=True)
remote_refs = [r for r in remote_refs_proc.stdout.splitlines() if r not in ("origin/HEAD", "origin/main")]

if allowlist_path:
    with open(allowlist_path, "r", encoding="utf-8") as f:
        allow = {line.strip() for line in f if line.strip()}
    remote_refs = [ref for ref in remote_refs if ref.replace("origin/", "") in allow]

branches = []
for ref in remote_refs:
    branch = ref.replace("origin/", "")
    authordate = run(["git", "log", "-1", "--format=%cI", ref], check=True).stdout.strip()
    files_proc = run(["git", "diff", "--name-only", f"{base}..{ref}"], check=True)
    files = [f for f in files_proc.stdout.splitlines() if f]
    merged = run(["git", "merge-base", "--is-ancestor", ref, base], check=False).returncode == 0
    branches.append({
        "branch": branch,
        "remote_ref": ref,
        "authordate": authordate,
        "file_count": len(files),
        "files_sample": files[:20],
        "already_on_main": merged,
        "merge_status": "already-merged" if merged else "pending-probe",
        "conflicts": []
    })

probe_targets = [b for b in branches if not b["already_on_main"]]
current_branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], check=True).stdout.strip()

if probe_targets and not dry_run:
    run(["git", "switch", "-C", integration, base], check=True)
    try:
        for item in probe_targets:
            ref = item["remote_ref"]
            merge_proc = run(["git", "merge", "--no-commit", "--no-ff", ref], check=False)
            if merge_proc.returncode == 0:
                item["merge_status"] = "clean"
            else:
                item["merge_status"] = "conflict"
                conflicts_proc = run(["git", "diff", "--name-only", "--diff-filter=U"], check=True)
                item["conflicts"] = [c for c in conflicts_proc.stdout.splitlines() if c]
            run(["git", "merge", "--abort"], check=False)
    finally:
        run(["git", "switch", current_branch], check=True)
        run(["git", "branch", "-D", integration], check=False)
elif probe_targets and dry_run:
    for item in probe_targets:
        item["merge_status"] = "not-probed-dry-run"

branches.sort(key=lambda b: (b["already_on_main"], b["branch"]))
conflicting = [b for b in branches if b["merge_status"] == "conflict"]

payload = {
    "base": base,
    "integration_branch": integration,
    "generated_at": now.isoformat(),
    "dry_run": dry_run,
    "allow_dirty": allow_dirty,
    "audit_status": "ok",
    "conflict_markers": conflict_markers(),
    "branches": branches,
}

os.makedirs(os.path.dirname(report_path) or ".", exist_ok=True)
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2)

status = f"✅ Reviewed {len(branches)} remote branches ({sum(1 for b in branches if b['already_on_main'])} already on main, {sum(1 for b in branches if not b['already_on_main'])} pending)."
if dry_run:
    status += " Merge simulation skipped due to --dry-run."

open_conflict_lines = []
if dry_run:
    open_conflict_lines.append("Conflict probe skipped (--dry-run).")
else:
    for b in conflicting:
        files = ", ".join(b["conflicts"]) if b["conflicts"] else "(files not detected)"
        open_conflict_lines.append(f"{b['branch']}: {files}")

next_steps = [
    "Merge or cherry-pick missing branch changes into main via an integration branch.",
    "Resolve listed conflicts (if any), then rerun this script to confirm clean status.",
]

write_summary(status, open_conflict_lines, next_steps)
print(f"Wrote reports to {report_path} and {summary_path}")
PY
