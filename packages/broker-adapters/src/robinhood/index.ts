import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.ts";

export class RobinhoodAdapter implements BrokerAdapter {
  id = "robinhood";
  name = "robinhood";

  async getAccounts(): Promise<Account[]> {
    return [];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    return [];
  }
}
