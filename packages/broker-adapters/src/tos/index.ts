import { Account, Position, AccountType } from "@goldshore/core-schema";
import { BrokerAdapter } from "../index.js";

/**
 * Schwab API Interface Definitions
 */
interface SchwabAccount {
  hashValue: string;
  securitiesAccount: {
    accountId: string;
    type: string;
    nickname?: string;
    isMarginEnabled?: boolean;
    optionLevel?: number;
    baseCurrency?: string;
  };
}

interface SchwabPosition {
  longQuantity?: number;
  shortQuantity?: number;
  averagePrice: number;
  marketValue: number;
  currentDayProfitLoss?: number;
  instrument: {
    symbol: string;
    assetType: "EQUITY" | "OPTION" | "MUTUAL_FUND" | "CASH_EQUIVALENT" | "FIXED_INCOME" | "CURRENCY";
    underlyingSymbol?: string;
    putCall?: "CALL" | "PUT";
    strikePrice?: number;
    expirationDate?: string;
  };
}

interface SchwabAccountDetails {
  securitiesAccount: {
    accountId: string;
    positions?: SchwabPosition[];
  };
}

export class TOSAdapter implements BrokerAdapter {
  id = "tos";
  name = "thinkorswim";
  private baseUrl = "https://api.schwabapi.com/trader/v1";
  private accessToken: string;
  private apiKey: string;

  constructor(accessToken: string, apiKey: string) {
    this.accessToken = accessToken;
    this.apiKey = apiKey;
  }

  /**
   * Helper to make authenticated requests to Schwab API
   */
  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Schwab-Client-Id": this.apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Schwab API Error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Fetches all accounts associated with the credentials
   */
  async getAccounts(): Promise<Account[]> {
    const rawAccounts = await this.request<SchwabAccount[]>("/accounts");

    return rawAccounts.map(raw => {
      const acc = raw.securitiesAccount;
      const accountId = raw.hashValue;

      return {
        id: accountId as any,
        broker: "tos",
        brokerAccountId: raw.hashValue,
        name: acc.nickname || `TOS Account ${acc.accountId.slice(-4)}`,
        type: this.mapAccountType(acc.type),
        baseCurrency: acc.baseCurrency || "USD",
        isMarginEnabled: acc.isMarginEnabled || false,
        optionsLevel: acc.optionLevel || 0,
        isCloseOnly: false,
        isPdtTracked: false,
        isIraRestricted: false,
        updatedAt: new Date(),
      } as Account;
    });
  }

  /**
   * Fetches positions for a given account
   * @param accountId The Schwab account hash (hashValue)
   */
  async getPositions(accountId: string): Promise<Position[]> {
    const rawResponse = await this.request<SchwabAccountDetails>(`/accounts/${accountId}?fields=positions`);
    const acc = rawResponse.securitiesAccount;

    if (!acc || !acc.positions) {
      return [];
    }

    return acc.positions.map((p) => {
      const quantity = p.longQuantity || (p.shortQuantity ? -p.shortQuantity : 0);
      const symbol = p.instrument.symbol;
      const posId = `${accountId}-${symbol}`;

      return {
        id: posId as any,
        accountId: accountId as any,
        instrumentId: null as any, // Linked during core sync
        quantity: quantity.toString(),
        averageOpenPrice: (p.averagePrice || 0).toString(),
        markPrice: quantity !== 0 ? (Math.abs(p.marketValue) / Math.abs(quantity)).toString() : "0",
        marketValue: (p.marketValue || 0).toString(),
        dayPnl: (p.currentDayProfitLoss || 0).toString(),
        unrealizedPnl: (p.marketValue - (p.averagePrice * quantity)).toString(),
        greeks: null,
        updatedAt: new Date(),
      } as Position;
    });
  }

  private mapAccountType(type: string): AccountType {
    const t = type?.toUpperCase() || "";
    if (t.includes("INDIVIDUAL")) return "INDIVIDUAL";
    if (t.includes("ROTH")) return "ROTH_IRA";
    if (t.includes("IRA")) return "IRA";
    if (t.includes("CASH")) return "CASH";
    return "MARGIN";
  }
}
