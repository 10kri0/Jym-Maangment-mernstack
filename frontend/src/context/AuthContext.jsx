import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('gym_admin_token'));
  const [adminName, setAdminName] = useState(localStorage.getItem('gym_admin_name') || '');
  const [adminEmail, setAdminEmail] = useState(localStorage.getItem('gym_admin_email') || '');
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, admin_name, admin_email } = response.data;
      
      localStorage.setItem('gym_admin_token', access_token);
      localStorage.setItem('gym_admin_name', admin_name);
      localStorage.setItem('gym_admin_email', admin_email);
      
      setToken(access_token);
      setAdminName(admin_name);
      setAdminEmail(admin_email);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Login failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gym_admin_token');
    localStorage.removeItem('gym_admin_name');
    localStorage.removeItem('gym_admin_email');
    setToken(null);
    setAdminName('');
    setAdminEmail('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, adminName, adminEmail, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
