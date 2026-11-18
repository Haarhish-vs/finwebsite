import React, { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { getAuthToken, setAuthToken } from '../api/apiClient';
import type { AdminUser } from '../api/types';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    try {
      const admin = await authApi.getMe();
      setUser(admin);
      setTokenState(existingToken);
    } catch {
      // Invalid or expired token
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [restoreSession, logout]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setTokenState(data.token);
    setUser(data.admin);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
