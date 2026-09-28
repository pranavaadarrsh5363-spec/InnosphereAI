'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<User>;
  googleLogin: (data?: any, rememberMe?: boolean) => Promise<User>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  demoLogin: (role: 'student' | 'mentor' | 'admin') => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('innosphere_token') || sessionStorage.getItem('innosphere_token');
  };

  const saveToken = (newToken: string, rememberMe: boolean = true) => {
    if (typeof window === 'undefined') return;
    if (rememberMe) {
      localStorage.setItem('innosphere_token', newToken);
      sessionStorage.removeItem('innosphere_token');
    } else {
      sessionStorage.setItem('innosphere_token', newToken);
      localStorage.removeItem('innosphere_token');
    }
    setToken(newToken);
  };

  const clearToken = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('innosphere_token');
    sessionStorage.removeItem('innosphere_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const storedToken = getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        const userData = await api.getMe();
        setUser(userData);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Auth auto-refresh error', err);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean = true): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      saveToken(res.access_token, rememberMe);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (data: any = {}, rememberMe: boolean = true): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.googleLogin(data);
      saveToken(res.access_token, rememberMe);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    return await api.forgotPassword(email);
  };

  const demoLogin = async (role: 'student' | 'mentor' | 'admin'): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      saveToken(res.access_token, true);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      saveToken(res.access_token, true);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        googleLogin,
        forgotPassword,
        demoLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
