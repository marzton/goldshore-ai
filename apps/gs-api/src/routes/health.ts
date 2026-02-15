import { Hono } from "hono";

const health = new Hono();
health.get("/", (c) => c.json({ status: "ok", service: "gs-api" }));
import { withContractHeaders } from "./contract";

const health = new Hono<{ Bindings: { API_VERSION?: string } }>();
health.get("/", (c) => c.json(withContractHeaders({ status: "ok", service: "gs-api" }, (c.env as { API_VERSION?: string } | undefined)?.API_VERSION)));

export default health;
