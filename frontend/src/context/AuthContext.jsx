import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('student360_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem('student360_user');
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('student360_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('student360_user', JSON.stringify(user));
      localStorage.setItem('student360_token', token);
    } else {
      localStorage.removeItem('student360_user');
      localStorage.removeItem('student360_token');
    }
  }, [user, token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('student360_user', JSON.stringify(data.user));
      localStorage.setItem('student360_token', data.token);
      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Invalid credentials';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('student360_user');
      localStorage.removeItem('student360_token');
    }
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('student360_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guest',
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

