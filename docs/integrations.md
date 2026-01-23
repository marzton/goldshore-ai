# Integrations Governance Controls

This document defines the governance controls required before enabling new external integrations
(such as ThinkorSwim). These controls are enforced in the gateway layer for all integration
requests (paths beginning with `/integrations` or `/market-streams`).

## Data Handling Classification

Each integration request must declare the sensitivity of the data being exchanged. The gateway
requires the `X-Data-Classification` header and rejects requests that do not comply.

**Allowed values**

- `public`: Non-sensitive information intended for general consumption.
- `internal`: Operational information restricted to GoldShore staff and systems.
- `confidential`: Customer, trading, or partner data that must be protected.
- `restricted`: Highly sensitive secrets or regulated data that requires strict controls.

## Secrets Access Policy

Integration requests must declare the level of secrets access required for the operation. The
`X-Secrets-Access-Policy` header is mandatory and must match one of the allowed values.

**Allowed values**

- `none`: No secrets are accessed.
- `read-only`: Secrets are read but not modified.
- `read-write`: Secrets are read and updated/rotated.
- `broker-credentials`: Broker or exchange credentials are accessed.
- `market-data`: Credentials or tokens used solely for market data access.

## Audit Log Trail

Every integration request must include a unique audit identifier so that calls can be traced end-to-end.
The gateway requires the `X-Audit-Trace-Id` header and records a structured audit log
entry to the gateway audit store.

**Audit log fields captured**

- Trace ID
- Data classification
- Secrets access policy
- Request method and path
- Timestamp
- Cloudflare ray ID (when available)
- Actor email (when available)

## Gateway Enforcement

The gateway rejects integration requests if any control is missing or invalid. Ensure that client
applications provide the required headers before requesting access to integration endpoints.
