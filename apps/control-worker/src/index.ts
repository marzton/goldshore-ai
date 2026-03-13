import { Hono } from "hono";
import * as DNS from "./libs/dns";
import * as Workers from "./libs/workers";
import * as Pages from "./libs/pages";

const app = new Hono();

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

export default app;
