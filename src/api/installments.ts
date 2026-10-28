import { api } from './apiClient';
import type { Installment, ApiResponse, Payment, PaginationMeta } from './types';

export interface InstallmentsResult {
  installments: Installment[];
  pagination: PaginationMeta;
}

export const installmentApi = {
  getInstallments: async (params?: {
    planId?: string;
    customerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InstallmentsResult> => {
    const res = await api.get<ApiResponse<Installment[] | { installments: Installment[]; pagination: PaginationMeta }>>('installments', params);
    if (Array.isArray(res.data)) {
      return {
        installments: res.data,
        pagination: res.pagination || {
          page: 1,
          limit: 50,
          totalRecords: res.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return {
      installments: res.data.installments || [],
      pagination: res.data.pagination || res.pagination!,
    };
  },

  getInstallmentById: async (id: string) => {
    const res = await api.get<ApiResponse<Installment>>(`installments/${id}`);
    return res.data;
  },

  updateInstallment: async (id: string, payload: { due_date?: string; amount_due?: number }) => {
    const res = await api.patch<ApiResponse<Installment>>(`installments/${id}`, payload);
    return res.data;
  },

  recordPayment: async (
    installmentId: string,
    payload: {
      amount: number;
      payment_date?: string;
      payment_method?: string;
      payment_reference?: string;
      notes?: string;
    }
  ) => {
    const res = await api.post<ApiResponse<{
      payment: Payment;
      installment: Installment;
      isFullyPaid: boolean;
      isLoanCompleted: boolean;
    }>>(`installments/${installmentId}/payments`, payload);
    return res.data;
  },

  getInstallmentPayments: async (installmentId: string) => {
    const res = await api.get<ApiResponse<Payment[]>>(`installments/${installmentId}/payments`);
    return res.data;
  },
};
