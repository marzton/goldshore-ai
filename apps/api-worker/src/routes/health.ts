import { Hono } from "hono";

const health = new Hono();

health.get("/", (c) => {
  return c.json({ status: "ok", service: "gs-api" });
});

export default health;
