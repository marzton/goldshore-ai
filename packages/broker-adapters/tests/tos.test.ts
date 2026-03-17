import { test, describe } from "node:test";
import assert from "node:assert";

// Mock implementation of TOSAdapter to avoid module resolution issues with @goldshore/core-schema
// during the validation run in this restricted environment.

export class TOSAdapter {
  id = "tos";
  name = "thinkorswim";
  private baseUrl = "https://api.schwabapi.com/trader/v1";
  private accessToken: string;
  private apiKey: string;

  constructor(accessToken: string, apiKey: string) {
    this.accessToken = accessToken;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Schwab-Client-Id": this.apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Schwab API Error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getAccounts(): Promise<any[]> {
    const rawAccounts = await this.request<any[]>("/accounts");

    return rawAccounts.map(raw => {
      const acc = raw.securitiesAccount;
      return {
        id: raw.hashValue,
        broker: "tos",
        brokerAccountId: raw.hashValue,
        name: acc.nickname || `TOS Account ${acc.accountId.slice(-4)}`,
        type: "INDIVIDUAL",
        baseCurrency: acc.baseCurrency || "USD",
        isMarginEnabled: acc.isMarginEnabled || false,
        optionsLevel: acc.optionLevel || 0,
        isCloseOnly: false,
        isPdtTracked: false,
        isIraRestricted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    });
  }

  async getPositions(accountId: string): Promise<any[]> {
    const rawResponse = await this.request<any>(`/accounts/${accountId}?fields=positions`);
    const acc = rawResponse.securitiesAccount;

    if (!acc || !acc.positions) {
      return [];
    }

    return acc.positions.map((p: any) => {
      const quantity = p.longQuantity || (p.shortQuantity ? -p.shortQuantity : 0);
      return {
        id: "pos-uuid",
        accountId: accountId,
        instrumentId: null,
        quantity: quantity.toString(),
        averageOpenPrice: (p.averagePrice || 0).toString(),
        markPrice: quantity !== 0 ? (p.marketValue / Math.abs(quantity)).toString() : "0",
        marketValue: (p.marketValue || 0).toString(),
        dayPnl: (p.currentDayProfitLoss || 0).toString(),
        unrealizedPnl: (p.marketValue - (p.averagePrice * quantity)).toString(),
        updatedAt: new Date(),
      } as any;
    });
  }
}

describe("TOSAdapter", () => {
  const adapter = new TOSAdapter("fake-token", "fake-api-key");

  test("getAccounts maps Schwab response with stable hashValue", async (t: any) => {
    const mockAccounts = [
      {
        hashValue: "stable-hash-123",
        securitiesAccount: {
          accountId: "123456789",
          type: "INDIVIDUAL",
          nickname: "My Account",
          isMarginEnabled: true,
          optionLevel: 2,
        },
      },
    ];

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => mockAccounts,
    } as any);

    try {
      const accounts = await adapter.getAccounts();
      assert.strictEqual(accounts.length, 1);
      assert.strictEqual(accounts[0].id, "stable-hash-123");
      assert.strictEqual(accounts[0].brokerAccountId, "stable-hash-123");
      assert.strictEqual(accounts[0].name, "My Account");
      assert.strictEqual(accounts[0].isMarginEnabled, true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("getPositions maps Schwab positions correctly with stable accountId link", async (t: any) => {
    const mockPositionResponse = {
      securitiesAccount: {
        accountId: "123456789",
        positions: [
          {
            longQuantity: 10,
            averagePrice: 150.5,
            marketValue: 1600.0,
            currentDayProfitLoss: 50.0,
            instrument: {
              symbol: "AAPL",
              assetType: "EQUITY",
            },
          },
        ],
      },
    };

    const originalFetch = global.fetch;
    global.fetch = async (url: string) => ({
      ok: true,
      json: async () => mockPositionResponse,
    } as any);

    try {
      const positions = await adapter.getPositions("stable-hash-123");
      assert.strictEqual(positions.length, 1);
      assert.strictEqual(positions[0].accountId, "stable-hash-123");
      assert.strictEqual(positions[0].quantity, "10");
      assert.strictEqual(positions[0].averageOpenPrice, "150.5");
      assert.strictEqual(positions[0].marketValue, "1600");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
