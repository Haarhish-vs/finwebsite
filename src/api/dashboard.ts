import { api } from './apiClient';
import type { ApiResponse, WeeklyCollectionsResponse } from './types';

export const dashboardApi = {
  getWeeklyCollections: async (params?: {
    week_date?: string;
    week_start?: string;
    week_end?: string;
  }): Promise<WeeklyCollectionsResponse> => {
    const res = await api.get<ApiResponse<WeeklyCollectionsResponse>>(
      'dashboard/weekly-collections',
      params
    );
    return res.data;
  },
};
