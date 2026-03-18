import { test, describe } from "node:test";
import assert from "node:assert";
import { TOSAdapter } from "./index.ts";

describe("TOSAdapter", () => {
  const mockFetch = async (url: string) => {
    if (url.endsWith("/accounts")) {
      return {
        status: 200,
        ok: true,
        json: async () => [
          {
            securitiesAccount: {
              accountId: "12345",
              type: "CASH"
            }
          }
        ]
      };
    }
    if (url.includes("/accounts/12345?fields=positions")) {
      return {
        status: 200,
        ok: true,
        json: async () => ({
          securitiesAccount: {
            positions: [
              {
                instrument: { symbol: "AAPL" },
                longQuantity: 10,
                averagePrice: 150
              }
            ]
          }
        })
      };
    }
    return { status: 404, ok: false };
  };

  const adapter = new TOSAdapter({
    apiKey: "test-key",
    accessToken: "test-token",
    baseUrl: "https://api.tdameritrade.com/v1"
  });

  // Inject mock fetch into the client
  (adapter as any).client = {
      get: async (path: string) => {
          const res = await mockFetch("https://api.tdameritrade.com/v1" + path);
          return res;
      }
  };

  test("has correct metadata", () => {
    assert.strictEqual(adapter.id, "tos");
    assert.strictEqual(adapter.name, "thinkorswim");
  });

  test("getAccounts returns mapped accounts", async () => {
    const accounts = await adapter.getAccounts();
    assert.strictEqual(accounts.length, 1);
    assert.strictEqual(accounts[0].id, "12345");
    assert.strictEqual(accounts[0].broker, "tos");
  });

  test("getPositions returns mapped positions", async () => {
    const positions = await adapter.getPositions("12345");
    assert.strictEqual(positions.length, 1);
    assert.strictEqual(positions[0].id, "AAPL");
    assert.strictEqual(Number(positions[0].quantity), 10);
  });
});
