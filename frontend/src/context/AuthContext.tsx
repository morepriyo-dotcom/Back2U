import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  sendPhoneOTP: (phone: string) => Promise<{ message: string; phone_number: string; expires_in_seconds: number; dev_sms_simulation?: string }>;
  verifyPhoneOTP: (phone: string, otp: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Failed to fetch user profile with stored token', err);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: string) => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOTP = async (phone: string) => {
    return await api.sendPhoneOTP(phone);
  };

  const verifyPhoneOTP = async (phone: string, otp: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const res = await api.verifyPhoneOTP(phone, otp, fullName);
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        demoLogin,
        sendPhoneOTP,
        verifyPhoneOTP,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
