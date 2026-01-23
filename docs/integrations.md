# Integrations Hub

This hub documents external integrations used by GoldShore services and the admin cockpit. The canonical configuration list for the admin UI lives in `apps/admin/src/lib/integrations.ts`.

## Integration Catalog

### Cloudflare API

| Field | Details |
| --- | --- |
| Base URL | `https://api.cloudflare.com/client/v4` |
| Auth method | API token (bearer) |
| Scopes | `Zone:Read`, `Zone:Edit`, `Workers:Read`, `Workers:Edit`, `Access:Read`, `Access:Edit`, `DNS:Read`, `DNS:Edit` |
| Rate limits | Global API limit (typically 1,200 requests / 5 min / user; endpoint-specific caps apply). |
| Data classification | Confidential (infrastructure metadata, DNS records, access policies). |

### Google APIs

| Field | Details |
| --- | --- |
| Base URL | `https://www.googleapis.com` |
| Auth method | OAuth 2.0 (user or service account) or API key for public endpoints |
| Scopes | `https://www.googleapis.com/auth/cloud-platform`, `https://www.googleapis.com/auth/userinfo.email` |
| Rate limits | Project- and API-specific quotas (varies by API; enforced in Google Cloud Console). |
| Data classification | Confidential (workspace, project, and identity metadata). |

### Google Gemini API

| Field | Details |
| --- | --- |
| Base URL | `https://generativelanguage.googleapis.com` |
| Auth method | API key (Google AI Studio) or OAuth 2.0 (Vertex AI) |
| Scopes | `https://www.googleapis.com/auth/cloud-platform` (Vertex AI) |
| Rate limits | Model- and project-specific quotas (see Google AI Studio or Vertex AI quotas). |
| Data classification | Confidential (prompt and completion content). |

### ThinkorSwim API

| Field | Details |
| --- | --- |
| Base URL | `https://api.tdameritrade.com/v1` |
| Auth method | OAuth 2.0 (authorization code + refresh token) |
| Scopes | `Account:Read`, `Account:Trade`, `MarketData:Read` |
| Rate limits | Typically ~120 requests/minute per user; subject to broker throttling. |
| Data classification | Restricted (brokerage credentials, account and trading data). |

### OpenAI / ChatGPT API

| Field | Details |
| --- | --- |
| Base URL | `https://api.openai.com/v1` |
| Auth method | API key (bearer) |
| Scopes | Project API key (model access scoped by project) |
| Rate limits | Per-model and per-project rate limits (configured in OpenAI dashboard). |
| Data classification | Confidential (prompt, completion, and usage telemetry). |

### Jules API

| Field | Details |
| --- | --- |
| Base URL | `https://api.goldshore.ai/jules` |
| Auth method | OAuth 2.0 (internal service-to-service tokens) |
| Scopes | `jules:read`, `jules:write`, `automation:run` |
| Rate limits | Internal gateway limits (align with automation workload SLOs). |
| Data classification | Confidential (automation runs, internal workflows, and task metadata). |
