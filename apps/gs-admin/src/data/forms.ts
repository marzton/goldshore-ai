export interface FormConfig {
  name: string;
  slug: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  fields: { label: string; type: string; required?: boolean }[];
  recipients: { name: string; channel: string }[];
  integrations: { name: string; status: 'enabled' | 'disabled'; type: string }[];
  submissionStatus: { received: number; stored: number; routed: number; failed: number };
  lastUpdated: string;
}

export const formConfigs: FormConfig[] = [
  {
    name: 'Contact Form',
    slug: 'contact',
    description: 'General inquiry form',
    status: 'active',
    fields: [
      { label: 'Name', type: 'text', required: true },
      { label: 'Email', type: 'email', required: true },
      { label: 'Message', type: 'textarea', required: true }
    ],
    recipients: [
      { name: 'Support Team', channel: 'Email' }
    ],
    integrations: [
      { name: 'HubSpot', status: 'enabled', type: 'CRM' }
    ],
    submissionStatus: { received: 120, stored: 120, routed: 118, failed: 2 },
    lastUpdated: new Date().toISOString()
  },
  {
    name: 'Newsletter Signup',
    slug: 'newsletter',
    description: 'Email subscription',
    status: 'active',
    fields: [
      { label: 'Email', type: 'email', required: true }
    ],
    recipients: [
      { name: 'Marketing', channel: 'List' }
    ],
    integrations: [
      { name: 'Mailchimp', status: 'enabled', type: 'Marketing' }
    ],
    submissionStatus: { received: 500, stored: 500, routed: 500, failed: 0 },
    lastUpdated: new Date().toISOString()
  }
];

export function getFormConfig(slug: string): FormConfig | undefined {
  return formConfigs.find((form) => form.slug === slug);
}
