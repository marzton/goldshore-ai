import { Hono } from "hono";
import * as Access from "./libs/access";
import * as DNS from "./libs/dns";
import * as Pages from "./libs/pages";
import * as Workers from "./libs/workers";
import { rotateKeys } from "./tasks/rotateKeys";
import { syncDNS } from "./tasks/syncDNS";

const app = new Hono<{ Bindings: Env }>();

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

app.post("/access/configure", async (c) => {
  const result = await Access.configure(c.env);
  return c.json(result);
});

async function handleScheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  const logKey = new Date().toISOString();

  ctx.waitUntil(env.CONTROL_LOGS.put(logKey, "control-run"));
  ctx.waitUntil(syncDNS(env));
  ctx.waitUntil(rotateKeys(env));
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled
};
