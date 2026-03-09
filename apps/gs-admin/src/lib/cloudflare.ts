export type CloudflareRuntimeLocals = {
  runtime?: {
    env?: Record<string, string | undefined>;
  };
};

export function getCloudflareContext(locals: CloudflareRuntimeLocals): Record<string, string | undefined> {
  return locals.runtime?.env || process.env;
}

export async function getCloudflareMetrics() {
  return {
    requests: 0,
    bandwidth: 0,
    threats: 0,
    pageViews: 0
  };
}
