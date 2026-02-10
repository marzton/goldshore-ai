import { Hono } from 'hono';

type GatewayBindings = {
  API: Fetcher;
};

const app = new Hono<{ Bindings: GatewayBindings }>();

app.all('/*', async (c) => {
  const incomingUrl = new URL(c.req.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, 'https://api.internal');

  const upstreamRequest = new Request(upstreamUrl.toString(), c.req.raw);
  return c.env.API.fetch(upstreamRequest);
});

export default app;
