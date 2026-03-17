import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.js";

/**
 * FidelityAdapter implements the BrokerAdapter interface for Fidelity Investments.
 *
 * Note: This is currently a structural implementation with mock data,
 * intended to be replaced with actual API calls to Fidelity's brokerage services.
 */
export class FidelityAdapter implements BrokerAdapter {
  id = "fidelity";
  name = "fidelity";

  async getAccounts(): Promise<Account[]> {
    // Mock implementation for structural completeness
    return [
      {
        id: "fid-acc-1",
        name: "Individual Brokerage",
        type: "INDIVIDUAL",
        broker: "fidelity",
        status: "ACTIVE",
        currency: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Account[];
  }

  async getPositions(accountId: string): Promise<Position[]> {
    // Mock implementation for structural completeness
    if (accountId !== "fid-acc-1") return [];

    return [
      {
        id: "pos-1",
        accountId: "fid-acc-1",
        instrumentId: "AAPL",
        symbol: "AAPL",
        quantity: "10",
        averagePrice: "150.00",
        currentPrice: "175.00",
        marketValue: "1750.00",
        costBasis: "1500.00",
        unrealizedPnl: "250.00",
        updatedAt: new Date(),
        metadata: {}
      }
    ] as Position[];
  }
}
