import { Hono } from "hono";
import { withContractHeaders } from "./contract";

const health = new Hono<{ Bindings: { API_VERSION?: string } }>();
health.get("/", (c) => c.json(withContractHeaders({ status: "ok", service: "gs-api" }, (c.env as { API_VERSION?: string } | undefined)?.API_VERSION)));

const health = new Hono();
health.get("/", (c) => c.json({ status: "ok", service: "gs-api" }));

export default health;
