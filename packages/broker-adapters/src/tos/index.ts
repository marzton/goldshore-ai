import type { Account, Position, Order } from "@goldshore/core-schema";
import type { BrokerAdapter } from "../index.ts";
import { createHttpClient, type HttpClient } from "@goldshore/integrations/http.ts";
import { TosAccountsResponseSchema, TosAccountSchema, TosOrdersResponseSchema } from "./schema.ts";

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
    const raw = await response.json();
    const result = TosAccountsResponseSchema.safeParse(raw);
    if (!result.success) return [];

    return result.data.map(acc => ({
      id: acc.securitiesAccount.accountId,
      broker: "tos" as const,
      brokerAccountId: acc.securitiesAccount.accountId,
      name: acc.securitiesAccount.accountId,
      type: acc.securitiesAccount.type as any,
      baseCurrency: "USD",
      isMarginEnabled: acc.securitiesAccount.type === "MARGIN",
      updatedAt: new Date(),
    } as Account));
  }

  async getPositions(accountId: string): Promise<Position[]> {
    const response = await this.client.get(`/accounts/${accountId}?fields=positions`);
    if (response.status !== 200) return [];
    const raw = await response.json();
    const result = TosAccountSchema.safeParse(raw);
    if (!result.success) return [];

    const positions = result.data.securitiesAccount.positions || [];
    return positions.map((p) => {
      const quantity = p.longQuantity || -p.shortQuantity || 0;
      return {
        id: `${accountId}-${p.instrument.symbol}`,
        accountId: accountId,
        quantity: quantity.toString(),
        averageOpenPrice: p.averagePrice.toString(),
        updatedAt: new Date(),
      } as Position;
    });
  }

  async getOrders(accountId: string): Promise<Order[]> {
    const response = await this.client.get(`/accounts/${accountId}/orders`);
    if (response.status !== 200) return [];
    const raw = await response.json();
    const result = TosOrdersResponseSchema.safeParse(raw);
    if (!result.success) return [];

    return result.data.map((o) => ({
      id: o.orderId.toString(),
      accountId: accountId,
      brokerOrderId: o.orderId.toString(),
      status: o.status as any,
      symbol: o.orderLegCollection[0]?.instrument?.symbol || "UNKNOWN",
      side: o.orderLegCollection[0]?.instruction as any,
      quantity: o.quantity.toString(),
      submittedAt: new Date(o.enteredTime),
      updatedAt: new Date(),
    } as Order));
  }
}
