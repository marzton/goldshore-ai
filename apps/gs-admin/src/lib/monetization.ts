export const analyticsProviders = [
  {
    name: 'Google Analytics 4',
    host: 'google-analytics.com',
    status: 'enabled',
    measurementId: 'G-XXXXXXXXXX',
    scriptPlacement: 'Global head',
    notes: 'Primary tracking'
  },
  {
    name: 'Plausible',
    host: 'plausible.io',
    status: 'enabled',
    measurementId: 'goldshore.ai',
    scriptPlacement: 'Body end',
    notes: 'Privacy-focused'
  }
];

export const adPlacements = [
  {
    name: 'Hero Banner',
    notes: 'Top of page',
    status: 'active',
    inventory: 'Direct sold',
    refresh: '30s',
    sizes: '728x90, 970x90'
  },
  {
    name: 'Sidebar',
    notes: 'Right column',
    status: 'paused',
    inventory: 'Programmatic',
    refresh: '60s',
    sizes: '300x250'
  }
];

export const affiliateLinks = [
  {
    partner: 'TradingView',
    status: 'active',
    program: 'Referral',
    trackingTag: '?ref=goldshore',
    defaultUrl: 'https://tradingview.com',
    payout: '30%'
  }
];

export const pageMonetizationConfigs = [
  {
    page: 'Home',
    analyticsEnabled: true,
    analyticsPlacement: 'Global head',
    adsEnabled: true,
    adPlacement: 'Hero Banner',
    affiliateSlot: 'None',
    notes: 'High traffic'
  },
  {
    page: 'Blog Post',
    analyticsEnabled: true,
    analyticsPlacement: 'Global head',
    adsEnabled: true,
    adPlacement: 'Inline Article',
    affiliateSlot: 'Sidebar resources',
    notes: 'Content heavy'
  }
];
