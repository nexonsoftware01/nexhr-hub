import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { setTokens, clearTokens, getAccessToken, refreshAccessToken } from '@/lib/api';

export type UserRole = 'DIRECTOR' | 'HR' | 'EMPLOYEE';

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

function formatNameFromEmail(email?: string): string {
  if (!email) return '';
  return email.split('@')[0]
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function extractUser(token: string): AuthUser | null {
  const payload = decodeJWT(token);
  if (!payload) return null;
  return {
    userId: payload.userId || payload.id || 0,
    email: payload.sub || payload.email || '',
    name: payload.name || formatNameFromEmail(payload.sub) || 'User',
    role: payload.role || 'EMPLOYEE',
  };
}

/** Minimum time (ms) before expiry to trigger a proactive refresh. */
const REFRESH_BUFFER_MS = 60_000; // 1 minute before expiry

/** Safety-net polling interval to check token freshness. */
const CHECK_INTERVAL_MS = 60_000; // every 60 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Schedule a proactive token refresh based on the current access token's exp. */
  const scheduleRefresh = useCallback(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const token = getAccessToken();
    if (!token) return;

    const decoded = decodeJWT(token);
    if (!decoded?.exp) return;

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    // Refresh 1 minute before expiry, but at least 5 seconds from now
    const delay = Math.max(expiresAt - now - REFRESH_BUFFER_MS, 5_000);

    refreshTimerRef.current = setTimeout(async () => {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          setUser(extractUser(newToken));
          // Schedule the next refresh based on the new token
          scheduleRefresh();
        }
      } else {
        // Refresh failed — session is dead
        clearTokens();
        setUser(null);
        window.location.href = '/login';
      }
    }, delay);
  }, []);

  /** Safety-net: periodically check if token is expired or about to expire. */
  const startCheckInterval = useCallback(() => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    checkIntervalRef.current = setInterval(async () => {
      const token = getAccessToken();
      if (!token) return;

      const decoded = decodeJWT(token);
      if (!decoded?.exp) return;

      const timeLeft = decoded.exp * 1000 - Date.now();

      // If token expires within the buffer window, refresh now
      if (timeLeft <= REFRESH_BUFFER_MS) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          const newToken = getAccessToken();
          if (newToken) {
            setUser(extractUser(newToken));
            scheduleRefresh();
          }
        } else {
          clearTokens();
          setUser(null);
          window.location.href = '/login';
        }
      }
    }, CHECK_INTERVAL_MS);
  }, [scheduleRefresh]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      const decoded = decodeJWT(token);

      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(extractUser(token));
        scheduleRefresh();
        startCheckInterval();
        setIsLoading(false);
        return;
      }

      // Token is expired — try to refresh
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        const newToken = getAccessToken();

        if (newToken) {
          setUser(extractUser(newToken));
          scheduleRefresh();
          startCheckInterval();
        } else {
          clearTokens();
          setUser(null);
        }
      } else {
        clearTokens();
        setUser(null);
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [scheduleRefresh, startCheckInterval]);

  const login = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setUser(extractUser(accessToken));
    scheduleRefresh();
    startCheckInterval();
  }, [scheduleRefresh, startCheckInterval]);

  const logout = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
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
