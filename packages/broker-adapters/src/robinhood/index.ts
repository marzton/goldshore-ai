import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.js";

/**
 * RobinhoodAdapter implements the BrokerAdapter interface for Robinhood.
 */
export class RobinhoodAdapter implements BrokerAdapter {
  id = "robinhood";
  name = "robinhood";

  async getAccounts(): Promise<Account[]> {
    return [
      {
        id: "rh-acc-1",
        name: "Robinhood Cash",
        type: "CASH",
        broker: "robinhood",
        status: "ACTIVE",
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Account[];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    if (accountId !== "rh-acc-1") return [];

    return [
      {
        id: "pos-3",
        accountId: "rh-acc-1",
        instrumentId: "MSFT",
        symbol: "MSFT",
        quantity: "15",
        averagePrice: "300.00",
        currentPrice: "320.00",
        marketValue: "4800.00",
        costBasis: "4500.00",
        unrealizedPnl: "300.00",
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Position[];
  }
}
