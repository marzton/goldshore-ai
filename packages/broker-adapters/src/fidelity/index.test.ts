import { FidelityAdapter } from "./index.ts";
import { describe, it } from "node:test";
import assert from "node:assert";

// Mock fetch for testing
const mockFetch = async (url: string) => {
  if (url.endsWith("/accounts")) {
    return new Response(JSON.stringify({
      accounts: [
        {
          id: "fid-1",
          accountNumber: "123456789",
          name: "Individual",
          type: "INDIVIDUAL",
          currency: "USD",
          marginEnabled: true,
          optionsLevel: 2,
          createdAt: "2023-01-01T00:00:00Z",
        }
      ]
    }), { status: 200 });
  }
  if (url.includes("/positions")) {
    return new Response(JSON.stringify({
      positions: [
        {
          id: "pos-1",
          instrumentId: "inst-1",
          quantity: 10,
          averagePrice: 150.5,
          lastPrice: 155.2,
          marketValue: 1552.0,
          dayPnl: 47.0,
          unrealizedPnl: 47.0,
        }
      ]
    }), { status: 200 });
  }
  return new Response(null, { status: 404 });
};

describe("FidelityAdapter", () => {
  it("should verify basic properties", () => {
    const adapter = new FidelityAdapter({ accessToken: "test" });
    assert.strictEqual(adapter.id, "fidelity");
    assert.strictEqual(adapter.name, "fidelity");
  });
});
