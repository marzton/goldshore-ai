import { Hono } from "hono";

const system = new Hono();

system.get("/info", (c) => {
  return c.json({
    service: "gs-api",
    timestamp: Date.now(),
  });
});

export default system;
