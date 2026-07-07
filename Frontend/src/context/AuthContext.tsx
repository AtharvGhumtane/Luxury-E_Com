import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on load
  useEffect(() => {
    const savedToken = localStorage.getItem('lvmh_token');
    const savedUser = localStorage.getItem('lvmh_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { accessToken, userId, role, firstName, lastName } = response.data;
      
      const userData: User = { userId, email, firstName, lastName, role };
      
      localStorage.setItem('lvmh_token', accessToken);
      localStorage.setItem('lvmh_user', JSON.stringify(userData));
      
      setToken(accessToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/register', {
        firstName,
        lastName,
        email,
        password,
      });
      const { accessToken, userId, role } = response.data;
      
      const userData: User = { userId, email, firstName, lastName, role };
      
      localStorage.setItem('lvmh_token', accessToken);
      localStorage.setItem('lvmh_user', JSON.stringify(userData));
      
      setToken(accessToken);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed. Check if user already exists.');
    }
  };

  const logout = () => {
    localStorage.removeItem('lvmh_token');
    localStorage.removeItem('lvmh_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
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
