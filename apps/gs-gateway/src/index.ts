import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { verifyAccess } from "@goldshore/auth";

interface GatewayEnv {
  API?: Fetcher;
  AGENT?: Fetcher;
  API_ORIGIN?: string;
  ENV?: string;
}

const app = new Hono<{ Bindings: GatewayEnv }>();

app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "CF-Access-Jwt-Assertion"],
  }),
);

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS" || c.req.path === "/" || c.req.path === "/health") {
    await next();
    return;
  }

  const authorized = await verifyAccess(c.req.raw, c.env);
  if (!authorized) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

app.get("/", (c) => c.json({ service: "gs-gateway", ok: true }));
app.get("/health", (c) => c.json({ status: "ok", service: "gs-gateway" }));

app.all("*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname.toLowerCase();

  if (host.startsWith("agent.")) {
    if (!c.env.AGENT) {
      return c.json({ error: "AGENT service binding not configured" }, 500);
    }

    return c.env.AGENT.fetch(c.req.raw);
  }

  if (c.env.API) {
    return c.env.API.fetch(c.req.raw);
  }

  if (c.env.API_ORIGIN) {
    const targetUrl = new URL(`${url.pathname}${url.search}`, c.env.API_ORIGIN);
    return fetch(targetUrl, c.req.raw);
  }

  return c.json({ error: "Upstream API not configured" }, 500);
});

export default app;
