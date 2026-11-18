import { api, setAuthToken } from './apiClient';
import type { ApiResponse, AuthLoginResponse, AdminUser } from './types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthLoginResponse> => {
    const res = await api.post<ApiResponse<AuthLoginResponse>>('auth/login', {
      email: email.trim(),
      password: password.trim(),
    });
    if (res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res.data;
  },

  getMe: async (): Promise<AdminUser> => {
    const res = await api.get<ApiResponse<AdminUser>>('auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post<ApiResponse<{ logged_out: boolean }>>('auth/logout');
    } catch {
      // Best-effort logout
    } finally {
      setAuthToken(null);
    }
  },
};
