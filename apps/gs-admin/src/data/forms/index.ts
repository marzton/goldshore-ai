export interface FormConfig {
  slug: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  description: string;
  recipients: Array<{ name: string; channel: string }>;
  integrations: Array<{ name: string; type: string; status: 'enabled' | 'disabled' }>;
  fields: Array<{ label: string; type: string; required?: boolean }>;
  submissionStatus: { received: number; stored: number; routed: number; failed: number };
  lastUpdated: string;
}

export const formConfigs: FormConfig[] = [];

export function getFormConfig(slug: string): FormConfig | undefined {
  return formConfigs.find((config) => config.slug === slug);
}