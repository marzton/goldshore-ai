import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.ts";

export class TOSAdapter implements BrokerAdapter {
  id = "tos";
  name = "thinkorswim";

  async getAccounts(): Promise<Account[]> {
    return [];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    return [];
  }
}
