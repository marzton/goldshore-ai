import { Hono } from 'hono';
import type { Env, Variables } from '../types';

// Ingestion endpoint for the Gold Shore marketing/measurement event bus
// (Cortex control plane). This is intentionally the ONLY write path into
// gs_events: per-network adapters (GA4, Google Ads, Meta, OpenAI) read from
// here and fan out, rather than each adapter accepting its own inbound
// event shape. See docs/ADR (marketing event bus, phase 1) for the target
// architecture this is the foundation of.
//
// This route is public (no CF Access claim required) because it is called
// directly from browsers on every Gold Shore property. It is reachable only
// over the existing CORS allowlist (APPROVED_API_ORIGINS in
// packages/shared/src/domain-registry.ts) enforced in src/index.ts.

const events = new Hono<{ Bindings: Env; Variables: Variables }>();

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const MAX_ITEMS = 50;
const MAX_STRING = 256;

const clip = (value: unknown, max = MAX_STRING): string | null => {
  if (typeof value !== 'string' || value.length === 0) return null;
  return value.slice(0, max);
};

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

interface GSEventPayload {
  event_id?: unknown;
  event?: unknown;
  occurred_at?: unknown;
  property?: { id?: unknown; domain?: unknown };
  session?: { anonymous_id?: unknown; user_id?: unknown };
  attribution?: {
    source?: unknown;
    medium?: unknown;
    campaign?: unknown;
    gclid?: unknown;
    fbclid?: unknown;
    oppref?: unknown;
  };
  commerce?: {
    currency?: unknown;
    value?: unknown;
    order_id?: unknown;
    items?: unknown;
  };
  consent?: {
    analytics?: unknown;
    advertising?: unknown;
    personalization?: unknown;
  };
}

const hashIp = async (ip: string | null): Promise<string | null> => {
  if (!ip) return null;
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

events.post('/', async (c) => {
  const body = await c.req.json<GSEventPayload>().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON body.' }, 400);

  const eventId = clip(body.event_id, 128);
  const eventName = clip(body.event, 64);
  const domain = clip(body.property?.domain, 253);
  const occurredAt = isIsoDate(body.occurred_at) ? (body.occurred_at as string) : null;

  if (!eventId || !eventName || !EVENT_NAME_PATTERN.test(eventName)) {
    return c.json({ error: 'event_id and a valid lowercase_snake_case event name are required.' }, 400);
  }
  if (!domain) return c.json({ error: 'property.domain is required.' }, 400);
  if (!occurredAt) return c.json({ error: 'occurred_at must be an ISO 8601 timestamp.' }, 400);

  const consent = body.consent ?? {};
  const consentAnalytics = consent.analytics === true ? 1 : 0;
  const consentAdvertising = consent.advertising === true ? 1 : 0;
  const consentPersonalization = consent.personalization === true ? 1 : 0;

  // No consent at all -> record the event happened (needed for basic product
  // analytics/debugging) but every downstream adapter must treat it as
  // ineligible. Adapters check consent columns themselves before sending;
  // this route never fans out to a network directly.
  const property = await c.env.PLATFORM_DB
    .prepare('SELECT id FROM properties WHERE domain = ?')
    .bind(domain)
    .first<{ id: string }>();

  const attribution = body.attribution ?? {};
  const commerce = body.commerce ?? {};
  const items = Array.isArray(commerce.items) ? commerce.items.slice(0, MAX_ITEMS) : null;
  const valueCents = typeof commerce.value === 'number' && Number.isFinite(commerce.value)
    ? Math.round(commerce.value * 100)
    : null;

  const forwardedFor = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for');
  const ipHash = await hashIp(forwardedFor ? forwardedFor.split(',')[0].trim() : null);

  try {
    await c.env.PLATFORM_DB.prepare(
      `INSERT INTO gs_events (
        event_id, event, occurred_at, property_id, domain,
        anonymous_id, user_id,
        attribution_source, attribution_medium, attribution_campaign, gclid, fbclid, oppref,
        currency, value_cents, order_id, items,
        consent_analytics, consent_advertising, consent_personalization,
        ingest_ip_hash, user_agent
      ) VALUES (?,?,?,?,?, ?,?, ?,?,?,?,?,?, ?,?,?,?, ?,?,?, ?,?)
      ON CONFLICT(event_id) DO NOTHING`,
    )
      .bind(
        eventId, eventName, occurredAt, property?.id ?? null, domain,
        clip(body.session?.anonymous_id, 128), clip(body.session?.user_id, 128),
        clip(attribution.source, 128), clip(attribution.medium, 128), clip(attribution.campaign, 128),
        clip(attribution.gclid, 128), clip(attribution.fbclid, 128), clip(attribution.oppref, 128),
        clip(commerce.currency, 3), valueCents, clip(commerce.order_id, 128), items ? JSON.stringify(items) : null,
        consentAnalytics, consentAdvertising, consentPersonalization,
        ipHash, clip(c.req.header('user-agent'), 512),
      )
      .run();
  } catch {
    return c.json({ error: 'Failed to record event.' }, 500);
  }

  return c.json({ received: true, event_id: eventId }, 202);
});

export default events;
