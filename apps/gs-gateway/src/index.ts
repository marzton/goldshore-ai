import { Hono } from "hono";

type Bindings = {
  API: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

const BODYLESS_METHODS = new Set(["GET", "HEAD"]);

app.all("/*", async (c) => {
  const url = new URL(c.req.url);
  const apiRequest = new Request(url.pathname + url.search, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: BODYLESS_METHODS.has(c.req.method) ? undefined : c.req.raw.body,
  });

  return c.env.API.fetch(apiRequest);
});

export default app;
