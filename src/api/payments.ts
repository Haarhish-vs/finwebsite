import { api } from './apiClient';
import type { Payment, ApiResponse, PaginationMeta } from './types';

export interface PaymentsResult {
  payments: Payment[];
  pagination: PaginationMeta;
}

export const paymentApi = {
  getPayments: async (params?: { customer_id?: string; plan_id?: string; page?: number; limit?: number }): Promise<PaymentsResult> => {
    const res = await api.get<ApiResponse<Payment[]>>('payments', params);
    return {
      payments: res.data || [],
      pagination: res.pagination || {
        page: 1,
        limit: 20,
        totalRecords: (res.data || []).length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },
};
