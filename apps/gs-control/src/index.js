import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { verifyAccessWithClaims } from "@goldshore/auth";
import { parseSystemSyncWritePayload } from "@goldshore/schema";

import * as DNS from "./libs/dns";
import * as Workers from "./libs/workers";
import * as Pages from "./libs/pages";
import * as Access from "./libs/access";
import { syncDNS } from "./tasks/syncDNS";
import { rotateKeys } from "./tasks/rotateKeys";
import { cloudflareRoutes } from "./routes/cloudflare";

const app = new Hono<{ Bindings: any }>();

// Security & CORS (Updated to support your admin domains)
app.use('*', secureHeaders());
app.use("*", cors({
    origin: (origin, c) => {
        const allowed = (c.env.ALLOWED_ORIGINS ?? "https://admin.goldshore.ai,https://admin-preview.goldshore.ai,http://localhost:4321").split(",");
        return origin && allowed.map(s => s.trim()).includes(origin) ? origin : undefined;
    },
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "CF-Access-Jwt-Assertion"],
    credentials: true
}));

// Auth Guard
app.use('*', async (c, next) => {
    if (c.req.path === '/' || c.req.method === "OPTIONS") return await next();
    const claims = await verifyAccessWithClaims(c.req.raw, c.env);
    if (!claims) return c.json({ error: 'Unauthorized' }, 401);
    c.set('accessClaims', claims);
    await next();
});

app.get("/", (c) => c.json({ service: "gs-control", ok: true }));

/**
 * [SOP] Unified System Sync
 * Validates and pushes configuration to the global GS_CONFIG KV
 */
app.post("/system/sync", async (c) => {
    const body = await c.req.json();
    
    // 1. Schema Validation
    const results = {
        routing: RoutingTableSchema.safeParse(body.ROUTING_TABLE),
        status: ServiceStatusSchema.safeParse(body.SERVICE_STATUS),
        ai: AiOrchestrationSchema.safeParse(body.AI_ORCHESTRATION)
    };

    if (!results.routing.success || !results.status.success || !results.ai.success) {
        return c.json({ 
            error: "Validation Failed", 
            details: {
                routing: results.routing.error,
                status: results.status.error,
                ai: results.ai.error
            } 
        }, 400);
    }

    // 2. Persistent Update to Global Config
    const timestamp = new Date().toISOString();
    await Promise.all([
        c.env.GS_CONFIG.put("ROUTING_TABLE", JSON.stringify(results.routing.data)),
        c.env.GS_CONFIG.put("SERVICE_STATUS", JSON.stringify(results.status.data)),
        c.env.GS_CONFIG.put("AI_ORCHESTRATION", JSON.stringify(results.ai.data)),
        // Audit log in CONTROL_LOGS
        c.env.CONTROL_LOGS.put(`sync_${Date.now()}`, JSON.stringify({
            user: c.get('accessClaims')?.email,
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

export default {
    fetch: app.fetch,
    async scheduled(_controller, env, _ctx) {
        await env.CONTROL_LOGS.put(Date.now().toString(), "cron-scheduled-run");
        await syncDNS(env);
        await rotateKeys(env);
    }
};
