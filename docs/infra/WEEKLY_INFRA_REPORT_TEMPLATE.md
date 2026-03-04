# Weekly Infrastructure & Stabilization Report

**Date:** YYYY-MM-DD
**Author:** Jules (Governance Agent)
**Phase:** [Current Phase, e.g., Phase 4 - Frontend Stabilization]

## 1. Executive Summary
*   **Overall Status:** [GREEN / YELLOW / RED]
*   **Key Achievement:** [e.g., Frontend Integrity Verified]
*   **Critical Blockers:** [List or None]

## 2. Workflow Health
*   **Total Workflows:** [Number]
*   **Passing:** [Number]
*   **Failing:** [Number]
*   **Disabled:** [Number] (gs-agent, gs-control, etc.)

| Workflow | Status | Failure Reason | Action |
| :--- | :--- | :--- | :--- |
| Deploy GS Web | ✅ / ❌ | | |
| Deploy GS API | ✅ / ❌ | | |
| Stabilization Task | ✅ / ❌ | | |

## 3. Branch Hygiene
*   **Total Branches:** [Number] (Target: < 15)
*   **Stale Branches (> 14 days):** [Number]
*   **Stabilization Branches:** [Number]

**Action Required:**
- [ ] Delete branch `x`
- [ ] Merge PR `y`

## 4. Production Render Status
**Target:** goldshore.ai (gs-web)

| Check | Status | Notes |
| :--- | :--- | :--- |
| HTTP 200 OK | ✅ / ❌ | |
| CSS Loaded | ✅ / ❌ | |
| JS Loaded | ✅ / ❌ | |
| No WAF Challenge | ✅ / ❌ | |
| Logo Rendered | ✅ / ❌ | |
| Font Loaded | ✅ / ❌ | |

**Target:** admin.goldshore.ai (gs-admin)

| Check | Status | Notes |
| :--- | :--- | :--- |
| Access Login | ✅ / ❌ | |
| Dashboard Load | ✅ / ❌ | |

## 5. Governance Violations
*   **New Violations:** [List or None]
    *   e.g., Unapproved app folder created
    *   e.g., Direct theme import in page
*   **Resolved Violations:** [List]

## 6. Routing & Cloudflare Policy Alignment Report

> Reporting rule: Any policy assertion without direct Cloudflare Access app/policy evidence must be labeled **UNVERIFIED**.

| Domain / Route | Worker route source (`wrangler.toml`) | Declared policy (repo config/docs) | Verified live enforcement (Cloudflare Access app/policy) | Status | Drift / inconsistency check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `goldshore.ai`, `www.goldshore.ai` | n/a (Pages/public web) | Public web (`No` Access). Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `preview.goldshore.ai`, `*-preview.goldshore.ai`, `{branch}.goldshore-pages.dev` (web) | n/a (Pages previews) | Web previews must be Access-gated (`GoldShore-Web-Preview`). Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `admin.goldshore.ai/*` | `apps/gs-admin/wrangler.toml` (`[env.production].route`) | Admin cockpit requires Access (`GoldShore-Admin-ZT`). Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `preview.admin.goldshore.ai/*` | `apps/gs-admin/wrangler.toml` (`[env.preview].route`) | Admin previews should match admin Access controls. Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `ops.goldshore.ai/*` | `apps/gs-control/wrangler.toml` (`routes`) | Control worker requires Access (`Yes`). Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `api.goldshore.ai/*` | `apps/gs-api/wrangler.toml` (`routes`) | API worker Access is `Optional` (private endpoints only). Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `gw.goldshore.ai/*` | `apps/gs-gateway/wrangler.toml` (`routes`) | Gateway worker Access is `Optional`. Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |
| `gateway.goldshore.ai/*`, `agent.goldshore.ai/*` | `apps/gs-gateway/wrangler.toml` (`routes`) | Not declared in `docs/domains-and-auth.md` domain table | `UNVERIFIED` | `UNVERIFIED` | Add/update docs if these are active production entrypoints. |
| `mail.goldshore.ai` | `apps/gs-mail/wrangler.toml` (mail worker; no HTTP route declared) | Mail handler is `No` Access. Source: `docs/domains-and-auth.md` | `UNVERIFIED` | `UNVERIFIED` | |

### Policy field requirements (per row)
- **Declared policy (repo config/docs):** quote exact statement from repository sources.
- **Verified live enforcement (Cloudflare Access app/policy):** record app name, policy name, and evidence (dashboard/API export).

### Drift rules
- If docs/config declare **Optional** Access but live report marks **Strict/Required**, flag as **INCONSISTENT (docs too weak vs live)**.
- If docs/config declare **Strict/Required** Access but live report is missing/optional, flag as **INCONSISTENT (live too weak vs docs)**.
- If a route exists in `wrangler.toml` but is absent from policy docs, flag as **DOCUMENTATION DRIFT**.

*   **WAF Rules Modified:** [Yes/No] (Should be No)

## 7. Next Week Goals
1.  [Goal 1]
2.  [Goal 2]
3.  [Goal 3]
