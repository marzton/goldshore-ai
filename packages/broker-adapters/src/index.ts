import { Account, Position } from "@goldshore/core-schema";

export interface BrokerAdapter {
  id: string;
  name: string;

  getAccounts(): Promise<Account[]>;
  getPositions(accountId: string): Promise<Position[]>;
  // ... future execution and stream hooks
}

export * from "./tos/index.ts";
export * from "./fidelity/index.ts";
export * from "./robinhood/index.ts";
