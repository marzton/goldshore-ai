import { Hono } from 'hono';

const app = new Hono();

const API_ORIGIN = 'https://api.goldshore.ai';

app.all('/*', async (c) => {
  const url = new URL(c.req.url);
  const target = API_ORIGIN + url.pathname + url.search;

  const req = new Request(target, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : undefined
  });

  const res = await fetch(req);
  return res;
});

export default app;
