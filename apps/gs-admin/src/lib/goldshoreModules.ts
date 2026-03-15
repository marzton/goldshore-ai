export interface GoldshoreModule {
  id: string;
  label: string;
  role: string;
  url: string;
  status: 'online' | 'unknown';
}

export const goldshoreModules: GoldshoreModule[] = [
  {
    id: 'gs-web',
    label: 'Web (Pages)',
    role: 'Public site',
    url: 'https://goldshore.ai',
    status: 'online',
  },
  {
    id: 'gs-admin',
    label: 'Admin (Pages)',
    role: 'Control panel',
    url: 'https://admin.goldshore.ai',
    status: 'online',
  },
  {
    id: 'gs-api',
    label: 'API Worker',
    role: 'Core API',
    url: 'https://api.goldshore.ai',
    status: 'online',
  },
  {
    id: 'gs-gateway',
    label: 'Gateway Worker',
    role: 'Routing /api/*',
    url: 'https://gw.goldshore.ai',
    status: 'unknown',
  },
  {
    id: 'gs-control',
    label: 'Control Worker',
    role: 'Infra automation',
    url: 'https://ops.goldshore.ai',
    status: 'unknown',
  },
  {
    id: 'gs-mail',
    label: 'Mail Worker',
    role: 'Email routing',
    url: 'https://mail.goldshore.ai',
    status: 'unknown',
  },
];

export const moduleDomainMappings = [
  'goldshore.ai → gs-web (Cloudflare Pages)',
  'admin.goldshore.ai → gs-admin',
  'api.goldshore.ai → gs-api',
  'gw.goldshore.ai → gs-gateway',
  'ops.goldshore.ai → gs-control',
  'mail.goldshore.ai → gs-mail',
] as const;
