export type CloudflareMetrics = {
  requests: number;
  bandwidth: number;
  threats: number;
  pageViews: number;
};

type CloudflareContext = {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
};

export function getCloudflareContext(locals: CloudflareContext) {
  return locals.runtime?.env || process.env;
}

export async function getCloudflareMetrics(): Promise<CloudflareMetrics> {
  return {
    requests: 0,
    bandwidth: 0,
    threats: 0,
    pageViews: 0,
  };
}
