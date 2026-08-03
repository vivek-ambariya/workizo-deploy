import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user data from backend
          const res = await api.get('accounts/me/');
          const refreshedUser = {
            ...res.data.user,
            profile: res.data.profile
          };
          setUser(refreshedUser);
          localStorage.setItem('user', JSON.stringify(refreshedUser));
        } catch (err) {
          console.error("Failed to restore session", err);
          // Token might be expired, Axios interceptor will try refresh or redirect
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login Function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('accounts/login/', { email, password });
      const { access, refresh, user: loggedUser } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      toast.success(`Welcome back, ${loggedUser.full_name}!`);
      return loggedUser;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Invalid email or password';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register Function
  const register = async (fullName, email, phone, password, role) => {
    setLoading(true);
    try {
      const res = await api.post('accounts/register/', {
        full_name: fullName,
        email,
        phone,
        password,
        role,
      });
      
      const { access, refresh, user: registeredUser } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const fullUser = {
        ...registeredUser,
        profile: null // initially null
      };
      
      localStorage.setItem('user', JSON.stringify(fullUser));
      setUser(fullUser);
      toast.success('Account created successfully!');
      return fullUser;
    } catch (err) {
      // Return specific field validation errors or fallback
      const errorData = err.response?.data || { detail: 'Registration failed' };
      throw errorData;
    } finally {
      setLoading(false);
    }
  };

  // Google Login Function
  const googleLogin = async (credential, role) => {
    setLoading(true);
    try {
      const res = await api.post('auth/google-login/', { credential, role });
      const { access, refresh, user: loggedUser } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      toast.success(`Welcome, ${loggedUser.full_name}!`);
      return loggedUser;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Google login failed';
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update Profile State
  const updateProfileState = (updatedUserAndProfile) => {
    const updated = {
      ...user,
      ...updatedUserAndProfile.user,
      profile: updatedUserAndProfile.profile
    };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  // Logout Function
  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await api.post('accounts/logout/', { refresh });
      } catch (err) {
        console.error("Logout request failed on backend", err);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateProfileState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
