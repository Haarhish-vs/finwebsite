/**
 * Centralized API Client for Finance Management System
 * Connects directly to deployed Render backend at https://finance-app-odjk.onrender.com/api/v1
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://finance-app-odjk.onrender.com';
const API_BASE_URL = `${RAW_BASE_URL.replace(/\/+$/, '')}/api/v1`;

export { API_BASE_URL, RAW_BASE_URL };

export class ApiError extends Error {
  status: number;
  data?: any;
  code?: string;
  isColdStart?: boolean;

  constructor(message: string, status = 500, data?: any, code?: string, isColdStart = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
    this.isColdStart = isColdStart;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 45000, params, headers, ...restOptions } = options;

  let urlStr = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;

  if (params) {
    const url = new URL(urlStr);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, String(val));
      }
    });
    urlStr = url.toString();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  try {
    const response = await fetch(urlStr, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    let parsedBody: any;

    if (contentType.includes('application/json')) {
      parsedBody = await response.json();
    } else {
      parsedBody = await response.text();
    }

    if (!response.ok) {
      const errMsg =
        parsedBody?.message ||
        (typeof parsedBody === 'string' ? parsedBody : `Server error (${response.status})`);
      throw new ApiError(errMsg, response.status, parsedBody, parsedBody?.code);
    }

    return parsedBody as T;
  } catch (error: any) {
    clearTimeout(timer);
    const duration = Date.now() - startTime;

    if (error.name === 'AbortError') {
      const isColdStart = duration >= 25000;
      throw new ApiError(
        isColdStart
          ? 'Backend is waking up from sleep (Render free tier cold start). Please wait a moment and try again.'
          : 'Request timed out. Please check your connection and try again.',
        408,
        null,
        'TIMEOUT',
        isColdStart
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (CORS or server unreachable)
    throw new ApiError(
      'Unable to connect to backend server. Render instance may be spinning up or network is offline.',
      0,
      null,
      'NETWORK_ERROR',
      true
    );
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', params, ...options }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
