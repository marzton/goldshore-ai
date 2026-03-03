# CLOUDFLARE_PUBLIC_POLICY

**Status:** ACTIVE
**Scope:** goldshore.ai (Pages / WAF)
**Version:** 1.0

## 1. Public Hosts
These domains MUST be publicly accessible without authentication or Cloudflare Managed Challenges (WAF) for legitimate traffic.

- `goldshore.ai` (Root)
- `www.goldshore.ai` (WWW Redirect)

**Requirement:** HTTP 200 OK for `GET /`.

## 2. Protected Hosts
These domains MAY require authentication (Cloudflare Access) or stronger WAF rules.

- `admin.goldshore.ai` (gs-admin) - Requires Access Login.
- `preview.goldshore.ai` (Staging) - Requires Access Login.
- `ops.goldshore.ai` (Internal) - Requires Access Login/VPN.

## 3. WAF Policy
- **Codex Authority:** READ-ONLY. Codex must NOT modify WAF rules.
- **Reporting:** Any deviation (e.g., `goldshore.ai` returning 403 or challenge) must be documented as a "Configuration Mismatch".

## 4. Current Configuration Check (Template)
- [ ] `goldshore.ai` -> Public (200 OK)
- [ ] `www.goldshore.ai` -> Public (200 OK/301)
- [ ] `admin.goldshore.ai` -> Protected (302 Redirect to Login or 403)
