import { Hono } from "hono";

const user = new Hono();

user.get("/:id", async (c) => {
  const id = c.req.param("id");
  return c.json({ user: id, msg: "User endpoint working" });
});

export default user;
