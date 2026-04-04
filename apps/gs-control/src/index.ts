import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { verifyAccessWithClaims, type AccessTokenPayload } from "@goldshore/auth";
import { parseSystemSyncWritePayload } from "@goldshore/schema";

import * as DNS from "./libs/dns";
import * as Workers from "./libs/workers";
import * as Pages from "./libs/pages";
import * as Access from "./libs/access";
import { getRequiredRoles, isAuthorizedRole } from "./libs/adminAuth";
import type { ControlEnv } from "./libs/types";
import { syncDNS } from "./tasks/syncDNS";
import { rotateKeys } from "./tasks/rotateKeys";
import { cloudflareRoutes } from "./routes/cloudflare";

type VerifyAccessWithClaims = typeof verifyAccessWithClaims;

export const createApp = (verifyAccess: VerifyAccessWithClaims = verifyAccessWithClaims) => {
  const app = new Hono<{
    Bindings: ControlEnv;
    Variables: {
      accessClaims: AccessTokenPayload | null;
    };
  }>();

  // Security & CORS (Updated to support your admin domains)
  app.use("*", secureHeaders());

  let allowedOriginsCache: Set<string> | null = null;
  let lastAllowedOrigins: string | undefined = undefined;

  app.use("*", cors({
    origin: (origin, c) => {
      const originsStr = c.env.ALLOWED_ORIGINS;
      if (!allowedOriginsCache || originsStr !== lastAllowedOrigins) {
        const origins = (originsStr ?? "https://admin.goldshore.ai,https://admin-preview.goldshore.ai,http://localhost:4321")
          .split(",")
          .map((s) => s.trim());
        allowedOriginsCache = new Set(origins);
        lastAllowedOrigins = originsStr;
      }

      return origin && allowedOriginsCache.has(origin) ? origin : undefined;
    },
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "CF-Access-Jwt-Assertion"],
    credentials: true
  }));

  // Auth Guard
  app.use("*", async (c, next) => {
    if (c.req.path === '/' || c.req.method === "OPTIONS") return await next();
    const claims = await verifyAccess(c.req.raw, c.env);
    if (!claims) return c.json({ error: 'Unauthorized' }, 401);
    c.set("accessClaims", claims);
    await next();
  });

  app.get("/", (c) => c.json({ service: "gs-control", ok: true }));

  /**
   * [SOP] Unified System Sync
   * Validates and pushes configuration to the global GS_CONFIG KV
   */
  app.post("/system/sync", async (c) => {
    const claims = c.get("accessClaims");
    const requiredRoles = getRequiredRoles(c.env);

    if (!isAuthorizedRole(claims, requiredRoles)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    if (!c.env.GS_CONFIG) {
      return c.json({ error: "Missing GS_CONFIG binding." }, 500);
    }

    const body = await c.req.json();

    // 1. Schema Validation
    const parsedPayload = parseSystemSyncWritePayload(body);

    if (!parsedPayload.success) {
        return c.json({
            error: "Validation Failed",
            details: parsedPayload.error.format()
        }, 400);
    }

    // 2. Persistent Update to Global Config
    const timestamp = new Date().toISOString();
    await Promise.all([
      c.env.GS_CONFIG.put("ROUTING_TABLE", JSON.stringify(parsedPayload.data.ROUTING_TABLE)),
      c.env.GS_CONFIG.put("SERVICE_STATUS", JSON.stringify(parsedPayload.data.SERVICE_STATUS)),
      c.env.GS_CONFIG.put("AI_ORCHESTRATION", JSON.stringify(parsedPayload.data.AI_ORCHESTRATION)),
      // Audit log in CONTROL_LOGS
      c.env.CONTROL_LOGS.put(`sync_${Date.now()}`, JSON.stringify({
        user: claims?.email,
        timestamp
      }))
    ]);

    return c.json({ success: true, syncedAt: timestamp });
  });

  // Existing Automation Routes
  app.post("/dns/apply", async (c) => c.json(await DNS.sync(c.env)));
  app.post("/workers/reconcile", async (c) => c.json(await Workers.reconcile(c.env)));
  app.post("/pages/deploy", async (c) => c.json(await Pages.deploy(c.env)));
  app.post("/access/audit", async (c) => c.json(await Access.audit(c.env)));

  app.route("/cloudflare", cloudflareRoutes);
  return app;
};

const app = createApp();

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    return new Response("gs-control OK", { status: 200 });
  },
};
