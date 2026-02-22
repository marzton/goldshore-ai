# Stabilization Sync Check Report

**Date:** Sun, 22 Feb 2026 06:47:59 GMT

## 1. Governance Compliance Check

✅ Directory structure compliant.

### ❌ Build Script Violation
- New scripts detected in root package.json: verify:web-dist, memory:check

### ❌ Workflow Violation (New Files)
- New workflows detected: canonical-structure-check.yml

✅ CI Actions compliant.

## 2. Branch Discipline Check

**Current Branch:** work

**Divergence vs main (unavailable locally):** Behind: 0, Ahead: 0

⚠️ Could not resolve a local main tracking ref; divergence defaults to 0/0 in this checkout.

## 3. CI State Snapshot (PR Context)

⚠️ gh CLI unavailable; unable to resolve PR CI status in this environment.

### Local Build Verification

| App | Status | Notes |
|---|---|---|
| **gs-web** | ❌ FAIL | Check run logs |
| **gs-admin** | ✅ PASS | |
| **gs-api** | ✅ PASS | |
| **gs-mail** | ✅ PASS | |

## 4. App-Level Repairs Required

Failures detected in: gs-web build failed.
**Guidance:** You may fix these inside `apps/*`. Do not modify `.github/`, `infra/`, or root scripts.

## 5. Recommendations

### ❌ Actions Required

- New scripts detected in root package.json: verify:web-dist, memory:check
- New workflows detected: canonical-structure-check.yml

**Do not self-fix. Escalate governance violations.**
**App-level repairs (types, imports) are permitted in apps/* only.**
