import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/authService';
import { getToken, setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, try to restore the session
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await getMe();
        setUser(res.data.user);
      } catch {
        setToken(null); // token expired/invalid
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await loginApi(credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const res = await registerApi(details);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
