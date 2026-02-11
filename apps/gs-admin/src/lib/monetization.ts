export type AnalyticsProvider = {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
  measurementId: string;
  host: string;
  scriptPlacement: string;
  notes: string;
};

export type AdPlacement = {
  id: string;
  name: string;
  status: 'enabled' | 'paused';
  inventory: string;
  sizes: string;
  refresh: string;
  notes: string;
};

export type AffiliateLink = {
  id: string;
  partner: string;
  program: string;
  status: 'active' | 'paused';
  defaultUrl: string;
  trackingTag: string;
  payout: string;
};

export type PageMonetizationConfig = {
  page: string;
  analyticsEnabled: boolean;
  analyticsPlacement: string;
  adsEnabled: boolean;
  adPlacement: string;
  affiliateSlot: string;
  notes: string;
};

export const analyticsProviders: AnalyticsProvider[] = [
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    status: 'enabled',
    measurementId: 'G-5H0R3-ANALYTICS',
    host: 'www.googletagmanager.com',
    scriptPlacement: 'Head (deferred)',
    notes: 'Primary traffic reporting for marketing dashboards.',
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    status: 'enabled',
    measurementId: 'goldshore.ai',
    host: 'plausible.io',
    scriptPlacement: 'Body end (async)',
    notes: 'Privacy-friendly backup for EU visitors.',
  },
  {
    id: 'segment',
    name: 'Segment',
    status: 'disabled',
    measurementId: 'SEG-9451',
    host: 'cdn.segment.com',
    scriptPlacement: 'Head (conditional)',
    notes: 'Enabled only for product telemetry pilots.',
  },
];

export const adPlacements: AdPlacement[] = [
  {
    id: 'hero-banner',
    name: 'Hero Banner',
    status: 'enabled',
    inventory: 'Homepage above-the-fold',
    sizes: '970x250, 728x90',
    refresh: 'Every 60s',
    notes: 'Premium sponsorship slot for launch campaigns.',
  },
  {
    id: 'inline-article',
    name: 'Inline Article',
    status: 'enabled',
    inventory: 'Blog + case study body',
    sizes: '336x280, 300x250',
    refresh: 'Every 90s',
    notes: 'Contextual ads injected after paragraph 3.',
  },
  {
    id: 'footer-banner',
    name: 'Footer Banner',
    status: 'paused',
    inventory: 'Docs + landing page footer',
    sizes: '728x90',
    refresh: 'No refresh',
    notes: 'Paused for Q4 brand refresh.',
  },
];

export const affiliateLinks: AffiliateLink[] = [
  {
    id: 'alpaca',
    partner: 'Alpaca Markets',
    program: 'Brokerage API referrals',
    status: 'active',
    defaultUrl: 'https://alpaca.markets/affiliate/goldshore',
    trackingTag: 'gs-alpaca-2025',
    payout: '$200 per funded account',
  },
  {
    id: 'tradier',
    partner: 'Tradier',
    program: 'Options trading referrals',
    status: 'active',
    defaultUrl: 'https://www.tradier.com/referral/goldshore',
    trackingTag: 'gs-tradier-ops',
    payout: 'Revenue share 20%',
  },
  {
    id: 'partner-stack',
    partner: 'PartnerStack',
    program: 'SaaS tooling bundle',
    status: 'paused',
    defaultUrl: 'https://partnerstack.com/goldshore',
    trackingTag: 'gs-ps-bundle',
    payout: 'Tiered commission',
  },
];

export const pageMonetizationConfigs: PageMonetizationConfig[] = [
  {
    page: '/ (Homepage)',
    analyticsEnabled: true,
    analyticsPlacement: 'Global head',
    adsEnabled: true,
    adPlacement: 'Hero Banner',
    affiliateSlot: 'CTA footer',
    notes: 'Highest traffic; maintain premium placement.',
  },
  {
    page: '/markets/alpaca',
    analyticsEnabled: true,
    analyticsPlacement: 'Page head',
    adsEnabled: true,
    adPlacement: 'Inline Article',
    affiliateSlot: 'Primary CTA card',
    notes: 'Include Alpaca referral tag.',
  },
  {
    page: '/docs',
    analyticsEnabled: true,
    analyticsPlacement: 'Global head',
    adsEnabled: false,
    adPlacement: 'None',
    affiliateSlot: 'Sidebar resources',
    notes: 'No ads; keep docs experience clean.',
  },
  {
    page: '/pricing',
    analyticsEnabled: true,
    analyticsPlacement: 'Page head',
    adsEnabled: false,
    adPlacement: 'None',
    affiliateSlot: 'FAQ panel',
    notes: 'Only affiliate links allowed.',
  },
];
