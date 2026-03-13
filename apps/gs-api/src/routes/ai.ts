import { Hono } from "hono";
import { createHash } from "node:crypto";
import { applyAnalysisPolicy, getProvider, type AnalysisRequest } from "@goldshore/ai-providers";
import safeStableStringify from "safe-stable-stringify";
import { logAuditEvent } from "@goldshore/utils";

type Env = {
  KV: KVNamespace;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
};

const ai = new Hono<{ Bindings: Env }>();

ai.get("/", (c) => c.json({ message: "AI endpoint" }));

ai.post("/analysis", async (c) => {
  let body: AnalysisRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  let policyResult;
  try {
    policyResult = applyAnalysisPolicy(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return c.json({ error: message }, 400);
  }

  const provider = getProvider(policyResult.sanitized.provider);
  if (!provider) {
    return c.json({ error: "Unsupported provider" }, 400);
  }

  const apiKey =
    policyResult.sanitized.provider === "openai"
      ? c.env.OPENAI_API_KEY
      : c.env.GEMINI_API_KEY;

  const startedAt = Date.now();
  const inputHash = createHash("sha256")
    .update(safeStableStringify(policyResult.sanitized))
    .digest("hex");
  const cacheKey = `analysis:${inputHash}`;

  let providerResponse: Awaited<ReturnType<typeof provider.analyze>> | null = null;
  let isCached = false;

  try {
    const cached = await c.env.KV.get<typeof providerResponse>(cacheKey, "json");
    if (cached) {
      providerResponse = cached;
      isCached = true;
    }
  } catch (err) {
    console.error("Failed to read from cache:", err);
  }

  if (!providerResponse) {
    providerResponse = await provider.analyze(policyResult.sanitized.input, {
      apiKey,
      fetch
    });

    try {
      const cacheValue = JSON.stringify(providerResponse);
      c.executionCtx.waitUntil(c.env.KV.put(cacheKey, cacheValue, { expirationTtl: 86400 }));
    } catch (err) {
      console.error("Failed to write to cache:", err);
    }
  }

  const durationMs = Date.now() - startedAt;

  c.executionCtx.waitUntil(
    logAuditEvent(c.env.KV, {
      action: "ai.analysis",
      status: "success",
      metadata: {
        request: policyResult.sanitized,
        response: {
          provider: providerResponse.provider
        },
        redactions: policyResult.redactions,
        durationMs,
        cache: isCached ? "HIT" : "MISS"
      }
    })
  );

  const response = c.json({
    ...providerResponse,
    redactions: policyResult.redactions,
    durationMs
  });
  response.headers.set("X-Cache", isCached ? "HIT" : "MISS");

  return response;
});

export default ai;
