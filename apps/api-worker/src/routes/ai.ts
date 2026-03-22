import { Hono } from "hono";
import { applyAnalysisPolicy, getProvider, type AnalysisRequest } from "@goldshore/ai-providers";

const ai = new Hono();

ai.get("/", (c) => c.json({ message: "AI endpoint" }));

ai.post("/analysis", async (c) => {
  let body: AnalysisRequest;
  try {
    body = await c.req.json();
  } catch (error) {
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
  const providerResponse = await provider.analyze(policyResult.sanitized.input, {
    apiKey,
    fetch,
  });
  const durationMs = Date.now() - startedAt;

  const logEntry = {
    event: "ai.analysis",
    timestamp: new Date().toISOString(),
    request: policyResult.sanitized,
    response: {
      provider: providerResponse.provider,
      // output is sensitive and should not be logged
    },
    redactions: policyResult.redactions,
    durationMs,
  };

  console.log(JSON.stringify(logEntry));

  return c.json({
    ...providerResponse,
    redactions: policyResult.redactions,
    durationMs,
  });
});

export default ai;
