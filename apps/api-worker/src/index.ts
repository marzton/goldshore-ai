import { Hono } from "hono";

const app = new Hono();

// health
import health from "./routes/health";
app.route("/health", health);

// user
import user from "./routes/user";
app.route("/user", user);

// system
import system from "./routes/system";
app.route("/system", system);

export default app;
