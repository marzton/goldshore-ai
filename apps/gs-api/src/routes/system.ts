import { Hono } from "hono";
import { getActor, logAdminAction, requirePermission } from "../auth";
import { Env, Variables } from "../types";
import { withContractHeaders } from "./contract";

type SystemConfig = {
  maintenanceMode: boolean;
  maxConcurrency: number;
  notes: string;
};

const DEFAULT_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maxConcurrency: 120,
  notes: ""
};

const CONFIG_KEY = "gs-api:config";

const parseConfig = (input: Partial<SystemConfig> | null): SystemConfig => {
  if (!input) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    maintenanceMode: Boolean(input.maintenanceMode),
    maxConcurrency:
      typeof input.maxConcurrency === "number" && Number.isFinite(input.maxConcurrency)
        ? Math.max(1, Math.floor(input.maxConcurrency))
        : DEFAULT_CONFIG.maxConcurrency,
    notes: typeof input.notes === "string" ? input.notes.slice(0, 500) : DEFAULT_CONFIG.notes
  };
};

const readConfig = async (kv: KVNamespace) => {
  const stored = await kv.get<SystemConfig>(CONFIG_KEY, "json");
  return parseConfig(stored);
};

const system = new Hono<{ Bindings: Env; Variables: Variables }>();

system.get("/info", (c) => {
  return c.json(withContractHeaders({
    service: "gs-api",
    timestamp: Date.now(),
  }, c.env.API_VERSION));
});

system.get("/status", async (c) => {
  return c.json(withContractHeaders({
    service: "gs-api",
    status: "online",
    uptime: `${Math.floor(performance.now() / 1000)}s`,
    timestamp: Date.now()
  }, c.env.API_VERSION));
});

system.get("/version", async (c) => {
  return c.json(withContractHeaders({
    service: "gs-api",
    version: c.env.API_VERSION ?? "unknown",
    deploySha: c.env.DEPLOY_SHA ?? null,
    timestamp: Date.now()
  }, c.env.API_VERSION));
});

system.get("/config", requirePermission("system:read"), async (c) => {
  const config = await readConfig(c.env.KV);
  return c.json(withContractHeaders({ config }, c.env.API_VERSION));
});

system.put("/config", requirePermission("system:manage"), async (c) => {
  const actor = getActor(c.get("accessClaims"), c.req.raw);
  const payload = await c.req.json<Partial<SystemConfig>>().catch(() => null);
  const config = parseConfig(payload);
  await c.env.KV.put(CONFIG_KEY, JSON.stringify(config));

  await logAdminAction(c.env, {
    action: "system.config.update",
    actor,
    status: "success",
    metadata: { config }
  });

  return c.json(withContractHeaders({ config }, c.env.API_VERSION));
});

export default system;
