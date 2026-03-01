export type SystemConfig = {
  maintenanceMode: boolean;
  maxConcurrency: number;
  notes: string;
};

export const DEFAULT_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maxConcurrency: 120,
  notes: ""
};

export const CONFIG_KEY = "gs-api:config";

export const parseConfig = (input: Partial<SystemConfig> | null): SystemConfig => {
  if (!input) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    maintenanceMode: Boolean(input.maintenanceMode),
    maxConcurrency:
      typeof input.maxConcurrency === "number" && Number.isFinite(input.maxConcurrency)
        ? Math.max(1, Math.floor(input.maxConcurrency))
        : DEFAULT_CONFIG.maxConcurrency,
    notes: typeof input.notes === "string" ? input.notes.slice(0, 500) : DEFAULT_CONFIG.notes
  };
};
