import { Hono } from "hono";

const users = new Hono();

users.get("/", async (c) => {
  return c.json([{ id: 1, email: "admin@goldshore.ai" }]);
});

export default users;
