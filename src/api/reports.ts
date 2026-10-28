import { api, API_BASE_URL } from './apiClient';
import type { ReportData, ApiResponse } from './types';

export const reportApi = {
  getReport: async (range = 'all_time'): Promise<ReportData> => {
    const res = await api.get<ApiResponse<ReportData>>('reports', { range });
    return res.data;
  },

  getCsvExportUrl: (range = 'all_time'): string => {
    return `${API_BASE_URL}/reports/export-csv?range=${encodeURIComponent(range)}`;
  },

  downloadCsv: async (range = 'all_time', filename?: string) => {
    const url = reportApi.getCsvExportUrl(range);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download CSV (${response.status})`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || `finance_report_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};
