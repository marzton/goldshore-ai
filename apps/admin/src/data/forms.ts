export type FormField = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
};

export type FormRecipient = {
  name: string;
  email: string;
  channel: string;
};

export type FormIntegration = {
  name: string;
  type: string;
  status: 'enabled' | 'disabled';
};

export type FormStatus = 'active' | 'paused' | 'archived';

export type FormConfig = {
  id: string;
  slug: string;
  name: string;
  status: FormStatus;
  description: string;
  fields: FormField[];
  recipients: FormRecipient[];
  integrations: FormIntegration[];
  lastUpdated: string;
  submissionStatus: {
    received: number;
    stored: number;
    routed: number;
    failed: number;
  };
};

export const formConfigs: FormConfig[] = [
  {
    id: 'form_001',
    slug: 'contact',
    name: 'Contact Sales',
    status: 'active',
    description: 'Primary contact intake form on the marketing site.',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Work email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea' }
    ],
    recipients: [
      { name: 'Sales Ops', email: 'sales-ops@goldshore.ai', channel: 'Email' },
      { name: 'Goldshore CRM', email: 'crm@goldshore.ai', channel: 'Webhook' }
    ],
    integrations: [
      { name: 'HubSpot Sync', type: 'CRM', status: 'enabled' },
      { name: 'Slack Alert', type: 'Messaging', status: 'enabled' }
    ],
    lastUpdated: '2024-04-19 09:12 AM',
    submissionStatus: {
      received: 128,
      stored: 128,
      routed: 124,
      failed: 4
    }
  },
  {
    id: 'form_002',
    slug: 'lead-qualification',
    name: 'Lead Qualification',
    status: 'active',
    description: 'Qualification workflow used by the intake page.',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Work email', type: 'email', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'teamSize', label: 'Team size', type: 'select' },
      { name: 'timeline', label: 'Timeline', type: 'select' }
    ],
    recipients: [
      { name: 'Growth Ops', email: 'growth@goldshore.ai', channel: 'Email' },
      { name: 'Pipeline', email: 'pipeline@goldshore.ai', channel: 'Webhook' }
    ],
    integrations: [
      { name: 'Salesforce Push', type: 'CRM', status: 'enabled' },
      { name: 'Segment', type: 'Data', status: 'enabled' }
    ],
    lastUpdated: '2024-04-18 02:47 PM',
    submissionStatus: {
      received: 74,
      stored: 74,
      routed: 72,
      failed: 2
    }
  },
  {
    id: 'form_003',
    slug: 'partner-intake',
    name: 'Partner Intake',
    status: 'paused',
    description: 'Temporary pause while partner onboarding is refreshed.',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Work email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'goals', label: 'Goals', type: 'textarea' }
    ],
    recipients: [
      { name: 'Partnerships', email: 'partners@goldshore.ai', channel: 'Email' }
    ],
    integrations: [
      { name: 'Notion Tracker', type: 'Workspace', status: 'disabled' }
    ],
    lastUpdated: '2024-04-10 11:20 AM',
    submissionStatus: {
      received: 16,
      stored: 16,
      routed: 0,
      failed: 0
    }
  }
];

export const getFormConfig = (slug: string) =>
  formConfigs.find((config) => config.slug === slug);
