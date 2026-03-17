import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.ts";

export class FidelityAdapter implements BrokerAdapter {
  id = "fidelity";
  name = "fidelity";

  async getAccounts(): Promise<Account[]> {
    return [];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    return [];
  }
}
