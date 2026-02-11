export async function routeRequest(req: Request, env: Env) {
  const url = new URL(req.url);
  const path = url.pathname;

  // Forward everything to internal API
  const target = `https://api.goldshore.ai${path}`;

  const res = await fetch(target, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  return res;
}
