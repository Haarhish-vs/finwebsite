import { api } from './apiClient';
import type { Customer, ApiResponse, CustomersListResponse, Loan } from './types';

export const customerApi = {
  getCustomers: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<CustomersListResponse>>('customers', params);
    return res.data;
  },

  getCustomerById: async (id: string) => {
    const res = await api.get<ApiResponse<Customer>>(`customers/${id}`);
    return res.data;
  },

  createCustomer: async (payload: {
    full_name: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    id_type?: string | null;
    id_number?: string | null;
    initial_amount_collected?: number;
    notes?: string;
  }) => {
    const res = await api.post<ApiResponse<Customer>>('customers', payload);
    return res.data;
  },

  updateCustomer: async (id: string, payload: Partial<Customer>) => {
    const res = await api.patch<ApiResponse<Customer>>(`customers/${id}`, payload);
    return res.data;
  },

  updateCustomerStatus: async (id: string, status: 'active' | 'inactive') => {
    const res = await api.patch<ApiResponse<Customer>>(`customers/${id}/status`, { status });
    return res.data;
  },

  getCustomerLoans: async (id: string) => {
    const res = await api.get<ApiResponse<Loan[]>>(`customers/${id}/loans`);
    return res.data;
  },

  deleteCustomer: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string; full_name: string; deleted: boolean }>>(`customers/${id}`);
    return res.data;
  },
};
