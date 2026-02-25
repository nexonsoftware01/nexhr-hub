import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setTokens, clearTokens, getAccessToken } from '@/lib/api';

export type UserRole = 'SUPER_ADMIN' | 'HR' | 'EMPLOYEE';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function extractUser(token: string): AuthUser | null {
  const payload = decodeJWT(token);
  if (!payload) return null;
  return {
    userId: payload.userId || payload.id || 0,
    email: payload.sub || payload.email || '',
    name: payload.name || payload.sub?.split('@')[0] || 'User',
    role: payload.role || 'EMPLOYEE',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(extractUser(token));
      } else {
        clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setUser(extractUser(accessToken));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
