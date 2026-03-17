import { Account, Position } from "@goldshore/core-schema";

export interface BrokerAdapter {
  id: string;
  name: string;

  getAccounts(): Promise<Account[]>;
  getPositions(accountId: string): Promise<Position[]>;
  // ... future execution and stream hooks
}

export * from "./tos/index.js";
export * from "./fidelity/index.js";
export * from "./robinhood/index.js";
