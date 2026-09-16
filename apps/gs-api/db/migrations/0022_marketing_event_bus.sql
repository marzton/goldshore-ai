-- Marketing/measurement event bus foundation (Cortex control-plane, phase 1).
-- Owner: gs-api. Binding: PLATFORM_DB.
--
-- `properties` is the authoritative per-domain marketing config registry
-- (GA4/Ads/Meta/OpenAI IDs, enabled adapters, consent policy). It is
-- intentionally separate from packages/shared/domain-registry.ts, which is a
-- source-controlled infra ownership map (repo/Worker per hostname) and is not
-- meant to be edited from Admin without a deploy. `properties` is DB-backed so
-- Admin can add a property or rotate a pixel ID without shipping code.
--
-- `gs_events` is the canonical event store: one row per GSEvent, written by
-- POST /v1/events before any per-network adapter fan-out. event_id is
-- caller-supplied and unique so the same conversion sent from both browser and
-- server channels (or retried) is deduplicated at write time, not downstream.
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  brand TEXT,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production','preview','development')),
  ga4_measurement_id TEXT,
  google_ads_customer_id TEXT,
  meta_pixel_id TEXT,
  meta_ad_account_id TEXT,
  instagram_business_account_id TEXT,
  openai_pixel_id TEXT,
  admob_app_id TEXT,
  consent_policy TEXT NOT NULL DEFAULT 'required' CHECK (consent_policy IN ('required','not_required')),
  enabled_adapters TEXT NOT NULL DEFAULT '[]', -- JSON array, e.g. ["ga4","google_ads","meta"]
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gs_events (
  event_id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),

  property_id TEXT REFERENCES properties(id),
  domain TEXT NOT NULL,

  anonymous_id TEXT,
  user_id TEXT,

  attribution_source TEXT,
  attribution_medium TEXT,
  attribution_campaign TEXT,
  gclid TEXT,
  fbclid TEXT,
  oppref TEXT,

  currency TEXT,
  value_cents INTEGER,
  order_id TEXT,
  items TEXT, -- JSON array

  consent_analytics INTEGER NOT NULL CHECK (consent_analytics IN (0,1)),
  consent_advertising INTEGER NOT NULL CHECK (consent_advertising IN (0,1)),
  consent_personalization INTEGER NOT NULL CHECK (consent_personalization IN (0,1)),

  ingest_ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_gs_events_domain_occurred ON gs_events(domain, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_gs_events_event_occurred ON gs_events(event, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_gs_events_anonymous_id ON gs_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_gs_events_user_id ON gs_events(user_id);

-- Per-adapter delivery ledger: did this event get sent to GA4/Google Ads/Meta/
-- OpenAI, and did it succeed. Keeps dedup/retry state out of gs_events itself
-- and lets an adapter be added later without altering the event table.
CREATE TABLE IF NOT EXISTS gs_event_deliveries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES gs_events(event_id) ON DELETE CASCADE,
  adapter TEXT NOT NULL CHECK (adapter IN ('ga4','google_ads','meta','openai')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped_no_consent')),
  attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
  response_code INTEGER,
  error TEXT,
  UNIQUE(event_id, adapter)
);

CREATE INDEX IF NOT EXISTS idx_gs_event_deliveries_status ON gs_event_deliveries(adapter, status);

-- Seed a property row for goldshore.ai so the registry isn't empty on day
-- one. The "GS pixel" web conversion source already live in Ads Manager has
-- a real google_ads_customer_id/conversion config that must be filled in by
-- an operator via Admin (or a follow-up data migration) — this migration
-- intentionally does not guess or hardcode that value.
INSERT OR IGNORE INTO properties (id, domain, brand, enabled_adapters)
VALUES ('goldshore-ai', 'goldshore.ai', 'Gold Shore', '[]');
