export type Submission = {
  id: string;
  formType: string;
  status: 'new' | 'read' | 'archived';
  name: string;
  email: string;
  company: string;
  role: string;
  website: string;
  teamSize: string;
  industry: string;
  timeline: string;
  budget: string;
  goals: string;
  message: string;
  receivedAt: string;
  ipAddress?: string;
  userAgent?: string;
};

export type FormField = {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
};

export type FormRecipient = {
  email: string;
  name?: string;
  channel?: string;
};

export type FormIntegration = {
  type: string;
  enabled?: boolean;
  settings?: Record<string, unknown>;
};

export type FormConfig = {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'disabled' | 'archived';
  fields: FormField[];
  recipients: FormRecipient[];
  integrations: FormIntegration[];
  createdAt: string;
  updatedAt: string;
};

export type MailRecipient = {
  email: string;
  name?: string;
};
