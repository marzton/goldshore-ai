import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.js";

/**
 * TOSAdapter implements the BrokerAdapter interface for TD Ameritrade (thinkorswim).
 */
export class TOSAdapter implements BrokerAdapter {
  id = "tos";
  name = "thinkorswim";

  async getAccounts(): Promise<Account[]> {
    return [
      {
        id: "tos-acc-1",
        name: "thinkorswim Margin Account",
        type: "MARGIN",
        broker: "tos",
        status: "ACTIVE",
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Account[];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    if (accountId !== "tos-acc-1") return [];

    return [
      {
        id: "pos-2",
        accountId: "tos-acc-1",
        instrumentId: "TSLA",
        symbol: "TSLA",
        quantity: "5",
        averagePrice: "200.00",
        currentPrice: "250.00",
        marketValue: "1250.00",
        costBasis: "1000.00",
        unrealizedPnl: "250.00",
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Position[];
  }
}
