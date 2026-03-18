import type { Account, Position, Order } from "@goldshore/core-schema";
import type { BrokerAdapter } from "../index.ts";

export class RobinhoodAdapter implements BrokerAdapter {
  id = "robinhood";
  name = "robinhood";

  async getAccounts(): Promise<Account[]> {
    return [];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    return [];
  }

  async getOrders(accountId: string): Promise<Order[]> {
    return [];
  }
}
