import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import * as DNS from "./libs/dns";
import * as Workers from "./libs/workers";
import * as Pages from "./libs/pages";
import * as Access from "./libs/access";
import type { ControlEnv } from "./libs/types";
import { syncDNS } from "./tasks/syncDNS";
import { rotateKeys } from "./tasks/rotateKeys";

const app = new Hono<{ Bindings: ControlEnv }>();

// Sentinel: Add security headers
app.use('*', secureHeaders());

app.get("/", (c) => c.json({ service: "gs-control", ok: true }));

app.post("/dns/apply", async (c) => {
  const result = await DNS.sync(c.env);
  return c.json(result);
});

app.post("/workers/reconcile", async (c) => {
  const result = await Workers.reconcile(c.env);
  return c.json(result);
});

app.post("/pages/deploy", async (c) => {
  const result = await Pages.deploy(c.env);
  return c.json(result);
});

app.post("/access/audit", async (c) => {
  const report = await Access.audit(c.env);
  return c.json(report);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, _ctx) {
    await env.CONTROL_LOGS.put(Date.now().toString(), "control-run");
    await syncDNS(env);
    await rotateKeys(env);
  }
};
