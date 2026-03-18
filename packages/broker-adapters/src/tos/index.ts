import type { Account, Position, Order } from "@goldshore/core-schema";
import type { BrokerAdapter } from "../index.js";
import { createHttpClient, type HttpClient } from "../../../integrations/http.ts";

export class TOSAdapter implements BrokerAdapter {
  id = "tos";
  name = "thinkorswim";
  private client: HttpClient;

  constructor(config?: { apiKey?: string; accessToken?: string; baseUrl?: string }) {
    this.client = createHttpClient({
      baseUrl: config?.baseUrl || "https://api.tdameritrade.com/v1",
      authTokenManager: config?.accessToken
        ? { getToken: async () => config.accessToken! }
        : undefined,
      headers: {
        "Authorization": config?.accessToken ? `Bearer ${config.accessToken}` : undefined,
      } as any
    });
  }

  async getAccounts(): Promise<Account[]> {
    const response = await this.client.get("/accounts");
    if (response.status !== 200) return [];
    const data = await response.json() as any[];
    return data.map(acc => ({
      id: acc.securitiesAccount.accountId,
      broker: "tos",
      brokerAccountId: acc.securitiesAccount.accountId,
      name: acc.securitiesAccount.accountId,
      type: acc.securitiesAccount.type,
      baseCurrency: "USD",
      isMarginEnabled: acc.securitiesAccount.type === "MARGIN",
      updatedAt: new Date(),
    } as any as Account));
  }

  async getPositions(accountId: string): Promise<Position[]> {
    const response = await this.client.get(`/accounts/${accountId}?fields=positions`);
    if (response.status !== 200) return [];
    const data = await response.json() as any;
    const positions = data.securitiesAccount.positions || [];
    return positions.map((p: any) => {
      const quantity = p.longQuantity || -p.shortQuantity || 0;
      return {
        id: `${accountId}-${p.instrument.symbol}`,
        accountId: accountId,
        quantity: quantity.toString(),
        averageOpenPrice: p.averagePrice.toString(),
        updatedAt: new Date(),
      } as any as Position;
    });
  }

  async getOrders(accountId: string): Promise<Order[]> {
    const response = await this.client.get(`/accounts/${accountId}/orders`);
    if (response.status !== 200) return [];
    const data = await response.json() as any[];
    return data.map((o: any) => ({
      id: o.orderId.toString(),
      accountId: accountId,
      brokerOrderId: o.orderId.toString(),
      status: o.status,
      symbol: o.orderLegCollection[0].instrument.symbol,
      side: o.orderLegCollection[0].instruction,
      quantity: o.quantity.toString(),
      submittedAt: new Date(o.enteredTime),
    } as any as Order));
  }
}
