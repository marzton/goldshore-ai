import { Hono } from "hono";

type Env = {
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  ENVIRONMENT: "production" | "preview" | "dev";
};

const app = new Hono<{ Bindings: Env }>();

app.get("/ops/ping", (c) => {
  return c.json({
    ok: true,
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/v1/health', (c) => c.json({ status: 'ok', service: 'gs-control' }));

app.get("/ops/preview/dns", async (c) => {
  // In a full implementation, this would:
  // - read infra/cloudflare/desired-state.yaml (baked into worker at build)
  // - query Cloudflare DNS via API
  // - diff expected vs actual
  // - return a "plan"
  return c.json({
    ok: true,
    message: "DNS preview not yet implemented in this skeleton.",
  });
});

app.post("/ops/apply/dns", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!body || body.confirm !== true) {
    return c.json(
      {
        ok: false,
        error:
          "Refusing to apply DNS changes without { confirm: true } in request body.",
      },
      400
    );
  }

  // Placeholder: Here you would loop through desired-state and call CF API.
  return c.json({
    ok: true,
    applied: [],
    note: "DNS apply logic not yet implemented in this skeleton.",
  });
});

export default app;
