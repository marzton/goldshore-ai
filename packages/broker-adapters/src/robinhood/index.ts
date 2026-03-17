import { Account, Position } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.js";

export interface RobinhoodAccount {
  account_number: string;
  url: string;
  type: string;
  base_currency: string;
  margin_balances?: {
    day_trade_buying_power: string;
    cash_available_for_withdrawal: string;
  };
}

export interface RobinhoodPosition {
  account: string;
  instrument: string;
  quantity: string;
  average_buy_price: string;
  updated_at: string;
}

export interface RobinhoodInstrument {
  id: string;
  symbol: string;
  name: string;
  type: string;
}

export interface RobinhoodPaginatedResponse<T> {
  results: T[];
  next: string | null;
}

/**
 * RobinhoodAdapter implements the BrokerAdapter interface for the Robinhood broker.
 * Note: This uses unofficial/private API endpoints which may change.
 */
export class RobinhoodAdapter implements BrokerAdapter {
  id = "robinhood";
  name = "robinhood";

  private token?: string;
  private instrumentCache = new Map<string, string>(); // URL -> Symbol

  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Generic request wrapper with auth and headers.
   */
  private async request<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: this.headers(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Robinhood API error (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetches all pages of a paginated Robinhood response.
   */
  private async fetchAllPages<T>(url: string): Promise<T[]> {
    let currentUrl: string | null = url;
    const allResults: T[] = [];

    while (currentUrl) {
      const data = await this.request<RobinhoodPaginatedResponse<T>>(currentUrl);
      allResults.push(...data.results);
      currentUrl = data.next;
    }

    return allResults;
  }

  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      // Use a realistic User-Agent to avoid being flagged by Robinhood's bot detection
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    };
  }

  /**
   * Extracts the UUID part from a Robinhood resource URL.
   */
  private extractUuidFromUrl(url: string): string {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1];
  }

  /**
   * Resolves a Robinhood instrument URL to its ticker symbol.
   */
  private async resolveInstrument(url: string): Promise<string> {
    if (this.instrumentCache.has(url)) {
      return this.instrumentCache.get(url)!;
    }

    try {
      const data = await this.request<RobinhoodInstrument>(url);
      this.instrumentCache.set(url, data.symbol);
      return data.symbol;
    } catch (e) {
      console.error(`Failed to resolve instrument ${url}:`, e);
      // Fallback to extracting the ID from URL if resolution fails
      return this.extractUuidFromUrl(url);
    }
  }

  async getAccounts(): Promise<Account[]> {
    const results = await this.fetchAllPages<RobinhoodAccount>(
      "https://api.robinhood.com/accounts/?default_to_all_accounts=true"
    );

    return results.map((acc) => ({
      // Note: Account.id is a UUID. Since RH account numbers aren't UUIDs,
      // we generate a random one for now. In a production sync, the ingestor
      // should handle deterministic mapping or lookup by brokerAccountId.
      id: crypto.randomUUID(),
      broker: "robinhood",
      brokerAccountId: acc.account_number,
      name: `Robinhood Account ${acc.account_number}`,
      type: acc.type.toUpperCase() as any,
      baseCurrency: acc.base_currency,
      isMarginEnabled: !!acc.margin_balances,
      optionsLevel: null,
      isCloseOnly: false,
      isPdtTracked: false,
      isIraRestricted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async getPositions(accountId: string): Promise<Position[]> {
    const url = new URL("https://api.robinhood.com/positions/");
    url.searchParams.set("account_number", accountId);
    url.searchParams.set("nonzero", "true");

    const results = await this.fetchAllPages<RobinhoodPosition>(url.toString());

    // Resolve instruments and map to canonical schema
    const positions = await Promise.all(
      results.map(async (pos) => {
        await this.resolveInstrument(pos.instrument);
        const instrumentUuid = this.extractUuidFromUrl(pos.instrument);

        return {
          id: crypto.randomUUID(),
          accountId: accountId as any, // Expects internal UUID in schema, but we pass broker ID here for mapping
          instrumentId: instrumentUuid, // Use the actual UUID from Robinhood
          quantity: pos.quantity,
          averageOpenPrice: pos.average_buy_price,
          markPrice: null,
          marketValue: null,
          dayPnl: null,
          unrealizedPnl: null,
          greeks: null,
          updatedAt: new Date(pos.updated_at),
        };
      })
    );

    return positions;
  }
}
