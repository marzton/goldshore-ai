# Open-Source Candidate Survey

> **Note:** This survey was prepared without direct repository inspection in this environment (no live GitHub queries). Details marked **Verify** should be confirmed against the project’s repository (license file, recent commits, release notes, security policies, and API docs) before adoption.

## eBay Listing Automation

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **saleweaver/ebay-python** | Python wrapper for eBay APIs. | **Verify** (often MIT) | **Verify** (maintainer activity varies) | **Verify** (check for security.md, releases) | eBay Trading/REST APIs | Good for scripting automation in Python; check eBay API version coverage. |
| **tdebatty/ebay-api** | Java client for eBay APIs. | **Verify** (often Apache-2.0) | **Verify** | **Verify** | eBay APIs | Useful for JVM stacks; confirm latest API endpoints supported. |
| **node-ebay-api** | Node.js client for eBay APIs. | **Verify** | **Verify** | **Verify** | eBay REST APIs | Helps with JavaScript-based listing pipelines; confirm OAuth scopes and rate limits. |

## PayPal + TurboTax + USA.gov Job Workflow

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **paypal/PayPal-Checkout-NodeJS-SDK** | Official PayPal Checkout SDK for Node.js. | **Verify** (BSD-2/Apache in past) | **Verify** (likely maintained) | **Verify** (official org, check advisories) | PayPal Checkout | Suitable for payments. Confirm version alignment with current PayPal APIs. |
| **paypal/PayPal-PHP-SDK** | Legacy PayPal PHP SDK. | **Verify** | **Verify** (may be deprecated) | **Verify** | PayPal REST APIs | Likely outdated; only consider if matching legacy integration needs. |
| **TurboTax API** | TurboTax / Intuit APIs are generally closed/partner-only. | N/A | N/A | N/A | Intuit Partner APIs | There isn’t a widely used open-source TurboTax automation library; expect restricted access. |
| **USA.gov job data** | USAJOBS APIs are public for government jobs. | N/A | N/A | N/A | USAJOBS REST API | Use official USAJOBS API directly; open-source client libraries exist in multiple languages (verify). |

## SSO with Google/Apple/GitHub/Twilio

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **nextauthjs/next-auth** | OAuth/SSO for Next.js. | **Verify** (ISC) | **Verify** | **Verify** | Google/Apple/GitHub, etc. | Strong ecosystem for web apps; verify Twilio (typically via custom provider). |
| **passportjs/passport** | Node.js authentication middleware. | **Verify** (MIT) | **Verify** | **Verify** | Many strategies | Mature and flexible; use provider strategies for Google/Apple/GitHub; Twilio via custom OAuth/2FA. |
| **ory/hydra + ory/kratos** | OAuth2/OIDC + identity management. | **Verify** | **Verify** | **Verify** (security policy present) | OIDC for providers | Enterprise-grade; requires infra; best for robust SSO and custom flows. |
| **supertokens/supertokens-core** | Auth + session management. | **Verify** | **Verify** | **Verify** | OAuth/OIDC | Open-source core + hosted options; assess license constraints. |

## PII Scrubbers for Web/Git

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **Yelp/detect-secrets** | Secret scanning for repos. | **Verify** (Apache-2.0) | **Verify** | **Verify** | CLI | Strong baseline for Git secret detection; integrate with pre-commit/CI. |
| **github/secret-scanning (gitleaks)** | **gitleaks/gitleaks** for secrets in git history. | **Verify** (MIT) | **Verify** | **Verify** | CLI/CI | Popular and performant; can redact from reports and block pushes. |
| **presidio (microsoft/presidio)** | PII detection/anonymization service. | **Verify** (MIT) | **Verify** | **Verify** | REST API | Robust PII detection for logs/web content. |
| **pii-scrubber (various)** | Multiple libraries in Python/Node. | **Verify** | **Verify** | **Verify** | Library/CLI | Evaluate detection quality and update cadence. |

## Business Opportunity Discovery Tools

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **awesome-business (curated lists)** | Curated lists of business ideas / SaaS. | **Verify** | **Verify** | **Verify** | N/A | Use as inspiration; not necessarily a tool. |
| **open-source CRM + lead enrichment** | Use open CRM + enrichment APIs. | **Verify** | **Verify** | **Verify** | Depends on provider | Combine with enrichment APIs (e.g., Clearbit alternatives) for opportunity discovery. |
| **OpenAlex / Crossref / data catalogs** | Public data sources for industry trends. | **Verify** | **Verify** | **Verify** | REST APIs | Useful for trend mining; need custom pipelines. |

## Monetization & Client Intake Pipelines

| Candidate | Summary | License | Activity | Security posture | API compatibility | Notes / Fit |
| --- | --- | --- | --- | --- | --- | --- |
| **Cal.com** | Scheduling + payments integrations. | **Verify** (AGPL) | **Verify** | **Verify** | Webhooks, Stripe | Useful for intake scheduling; check AGPL constraints. |
| **Formbricks** | Surveys + user feedback. | **Verify** | **Verify** | **Verify** | Webhooks/SDK | Intake forms and onboarding questionnaires. |
| **n8n-io/n8n** | Workflow automation. | **Verify** (Fair Code) | **Verify** | **Verify** | Hundreds of connectors | Great for intake automation; check license for commercial use. |
| **Budibase / Appsmith** | Low-code app builders. | **Verify** | **Verify** | **Verify** | REST, webhooks | Build client intake portals quickly; ensure license alignment. |

## Recommendations / Next Steps

1. **Confirm licenses** via each repo’s LICENSE file and ensure compatibility with intended use (commercial vs. internal vs. SaaS).
2. **Validate activity** by checking recent commits/releases and issue response time.
3. **Review security posture**: look for SECURITY.md, published advisories, signed releases, and dependency policies.
4. **Test API compatibility** with minimal proof-of-concept integrations before committing.

