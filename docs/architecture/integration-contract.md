# Cross-Service Integration Contract

This contract defines required runtime values and service links so preview and production stacks remain isolated.

## Frontend origin contract

### Required `PUBLIC_*` variables

- `PUBLIC_API`
- `PUBLIC_GATEWAY`

### Allowed values by env

- Preview
  - `PUBLIC_API=https://api-preview.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw-preview.goldshore.ai`
- Production
  - `PUBLIC_API=https://api.goldshore.ai`
  - `PUBLIC_GATEWAY=https://gw.goldshore.ai`

Frontends must never point preview builds at production worker hostnames.

## Worker service binding contract

### gs-gateway

- Preview: bind `API` to `gs-api` with `environment = "preview"`
- Prod: bind `API` to `gs-api` with `environment = "prod"`

### gs-control

- Preview:
  - bind `API` to `gs-api` preview
  - bind `GATEWAY` to `gs-gateway` preview
- Prod:
  - bind `API` to `gs-api` prod
  - bind `GATEWAY` to `gs-gateway` prod

## Mail intake contract

Worker: `gs-mail`

### Endpoint

- `POST /v1/forms/intake`

### CORS

Allowed origins:

- `https://goldshore.ai`
- Pages preview origins (`*.pages.dev`)

`OPTIONS /v1/forms/intake` must return preflight headers.

### Auth and headers

- Optional bearer auth via `GS_MAIL_API_TOKEN`.
- Outbound sender must use verified domain address:
  - `From: onboarding@goldshore.ai`
- User email from payload must be set in `Reply-To`.

### Payload shape

```json
{
  "submission": {
    "id": "uuid",
    "formType": "contact",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Example Inc",
    "message": "Need onboarding support",
    "receivedAt": "2026-03-06T12:00:00.000Z"
  },
  "recipients": [{ "email": "ops@goldshore.ai", "name": "Ops" }],
  "subject": "New contact submission",
  "text": "...",
  "html": "..."
}
```

### Response shape

- Success: `{ "ok": true }`
- Failure: `{ "ok": false, "error": "..." }`

## Required Cloudflare bindings by worker

### gs-api

- KV: `KV`, `CONTROL_LOGS`
- D1: `DB`
- R2: `ASSETS`
- AI: `AI`

### gs-gateway

- KV: `GATEWAY_KV`
- Queues producer: `JOB_QUEUE`
- Service: `API`
- AI: `AI`

### gs-control

- KV: `CONTROL_LOGS`
- R2: `STATE`
- Services: `API`, `GATEWAY`

### gs-mail

- KV: `GS_CONFIG`
- Secret: `RESEND_API_KEY`
- Optional secret: `GS_MAIL_API_TOKEN`
