export function getCloudflareContext(locals: any) {
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
