import { api } from './apiClient';
import type { Loan, ApiResponse, LoanPreviewResponse, Installment, PaginationMeta } from './types';

export interface LoansResult {
  loans: Loan[];
  pagination: PaginationMeta;
}

export const loanApi = {
  previewLoan: async (payload: {
    principal: number;
    interest_rate: number;
    frequency?: string;
    total_installments: number;
    start_date?: string;
    first_due_date?: string;
    custom_installments?: Array<{
      installment_number: number;
      due_date?: string;
      amount_due?: number;
    }>;
  }) => {
    const res = await api.post<ApiResponse<LoanPreviewResponse>>('loans/preview', payload);
    return res.data;
  },

  createLoan: async (payload: {
    idempotency_key?: string;
    plan_code?: string;
    customer_id?: string;
    customer_name?: string;
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    principal: number;
    interest_rate: number;
    frequency?: string;
    total_installments: number;
    start_date?: string;
    first_due_date?: string;
    down_payment?: number;
    notes?: string;
    custom_installments?: Array<{
      installment_number: number;
      due_date: string;
      amount_due: number;
    }>;
  }) => {
    const res = await api.post<ApiResponse<{ loan: Loan; summary: any; installments: Installment[] }>>('loans', payload);
    return res.data;
  },

  getLoans: async (params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }): Promise<LoansResult> => {
    const res = await api.get<ApiResponse<Loan[] | { loans: Loan[]; pagination: PaginationMeta }>>('loans', params);
    // Backend returns data: [ ... ], pagination: { ... } or data: { loans: [ ... ], pagination: { ... } }
    if (Array.isArray(res.data)) {
      return {
        loans: res.data,
        pagination: res.pagination || {
          page: 1,
          limit: 10,
          totalRecords: res.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return {
      loans: res.data.loans || [],
      pagination: res.data.pagination || res.pagination!,
    };
  },

  getLoanById: async (id: string) => {
    const res = await api.get<ApiResponse<{ loan: Loan; installments: Installment[] }>>(`loans/${id}`);
    return res.data;
  },

  getLoanInstallments: async (id: string) => {
    const res = await api.get<ApiResponse<Installment[]>>(`loans/${id}/installments`);
    return res.data;
  },

  updateLoan: async (id: string, payload: { title?: string; status?: string; notes?: string }) => {
    const res = await api.patch<ApiResponse<Loan>>(`loans/${id}`, payload);
    return res.data;
  },
};
