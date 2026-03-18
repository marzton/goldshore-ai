import { type Account, type Position } from "@goldshore/core-schema";
import { type BrokerAdapter } from "../index.js";
import { createHttpClient } from "@goldshore/integrations";

export interface FidelityConfig {
  baseUrl?: string;
  accessToken: string;
  fetchFn?: typeof fetch;
}

export class FidelityAdapter implements BrokerAdapter {
  id = "fidelity";
  name = "fidelity";
  private client: ReturnType<typeof createHttpClient>;

  constructor(config: FidelityConfig) {
    this.client = createHttpClient({
      baseUrl: config.baseUrl || "https://api.fidelity.com/v1",
      authTokenManager: {
        getToken: async () => config.accessToken,
      },
      fetchFn: config.fetchFn,
    });
  }

  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get("/accounts");
    if (!response.ok) {
      throw new Error(`Failed to fetch Fidelity accounts: ${response.status}`);
    }
    const data = await response.json() as any;
    return data.accounts.map((acc: any) => ({
      id: acc.id,
      broker: "fidelity",
      brokerAccountId: acc.accountNumber,
      name: acc.name,
      type: acc.type,
      baseCurrency: acc.currency || "USD",
      isMarginEnabled: acc.marginEnabled || false,
      optionsLevel: acc.optionsLevel || 0,
      isCloseOnly: false,
      isPdtTracked: false,
      isIraRestricted: acc.type?.includes("IRA") ?? false,
      createdAt: new Date(acc.createdAt),
      updatedAt: new Date(),
    }));
  }

  async getPositions(accountId: string): Promise<Position[]> {
    const response = await this.client.get(`/accounts/${accountId}/positions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Fidelity positions: ${response.status}`);
    }
    const data = await response.json() as any;
    return data.positions.map((pos: any) => ({
      id: pos.id,
      accountId: accountId,
      instrumentId: pos.instrumentId,
      quantity: pos.quantity.toString(),
      averageOpenPrice: pos.averagePrice.toString(),
      markPrice: pos.lastPrice.toString(),
      marketValue: pos.marketValue.toString(),
      dayPnl: pos.dayPnl.toString(),
      unrealizedPnl: pos.unrealizedPnl.toString(),
      greeks: pos.greeks || null,
      updatedAt: new Date(),
    }));
  }
}
