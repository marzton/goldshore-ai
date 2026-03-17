import { Account, Position, OptionGreeks } from "@goldshore/core-schema";
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
  // Option specific
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  impliedVolatility?: number;
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
        "Schwab-Client-Id": this.apiKey, // Corrected header based on common Schwab API docs
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
      const accountId = raw.hashValue; // Stable ID

      return {
        id: accountId as any, // In a real scenario, this matches the DB UUID or is mapped via a lookup
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
        createdAt: new Date(),
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
      const posId = crypto.randomUUID(); // Position instances are typically transient in this context

      const greeks: OptionGreeks | null = p.instrument.assetType === "OPTION" ? {
        delta: p.delta,
        gamma: p.gamma,
        theta: p.theta,
        vega: p.vega,
        rho: p.rho,
        impliedVolatility: p.impliedVolatility
      } : null;

      return {
        id: posId as any,
        accountId: accountId as any, // Link back to the stable Account ID (hashValue)
        instrumentId: null as any, // This would be looked up in the DB by symbol/type
        quantity: quantity.toString(),
        averageOpenPrice: (p.averagePrice || 0).toString(),
        markPrice: quantity !== 0 ? (p.marketValue / Math.abs(quantity)).toString() : "0",
        marketValue: (p.marketValue || 0).toString(),
        dayPnl: (p.currentDayProfitLoss || 0).toString(),
        unrealizedPnl: (p.marketValue - (p.averagePrice * quantity)).toString(),
        greeks: greeks as any,
        updatedAt: new Date(),
      } as Position;
    });
  }

  private mapAccountType(type: string): "INDIVIDUAL" | "IRA" | "ROTH_IRA" | "CASH" | "MARGIN" {
    const t = type?.toUpperCase() || "";
    if (t.includes("INDIVIDUAL")) return "INDIVIDUAL";
    if (t.includes("ROTH")) return "ROTH_IRA";
    if (t.includes("IRA")) return "IRA";
    if (t.includes("CASH")) return "CASH";
    return "MARGIN";
  }
}
