import { api } from './apiClient';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  uptimeSeconds?: number;
}

export interface DbHealthStatus {
  status: string;
  database: {
    connected: boolean;
    provider: string;
    checkedTable: string;
    latencyMs: number;
    totalRecords: number;
  };
}

export const healthApi = {
  checkApi: async () => {
    return api.get<{ success: boolean; data: HealthStatus }>('health', undefined, { timeoutMs: 15000 });
  },

  checkDb: async () => {
    return api.get<{ success: boolean; database: DbHealthStatus['database'] }>('health/db', undefined, { timeoutMs: 20000 });
  },
};
