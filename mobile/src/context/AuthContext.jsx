import React, { createContext, useContext, useState, useEffect } from 'react';
import { mobileApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  useEffect(() => {
    // Setup 401 session expiration handler
    mobileApi.setSessionExpiredHandler((msg) => {
      setUser(null);
      setSessionMessage(msg || 'Your session has expired. Please log in again.');
    });

    const initAuth = async () => {
      try {
        const token = await mobileApi.getToken();
        if (token) {
          const userData = await mobileApi.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.log('Mobile session initialization:', error.message);
        await mobileApi.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setSessionMessage('');
    const data = await mobileApi.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (fullName, email, password) => {
    setSessionMessage('');
    const data = await mobileApi.register(fullName, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await mobileApi.logout();
    } finally {
      setUser(null);
      setSessionMessage('');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        sessionMessage,
        setSessionMessage,
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
