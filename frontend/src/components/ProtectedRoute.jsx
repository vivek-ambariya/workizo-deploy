import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        bgcolor="#FAFAFB"
      >
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Verifying session, please wait...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Save current path to redirect back after successful login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirect_after_login', currentPath);

    // Determine where to redirect based on the requested role scope
    if (allowedRoles && allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRoles && allowedRoles.includes('worker')) {
      return <Navigate to="/captain/login" replace />;
    }
    return <Navigate to="/customer/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Authenticated but wrong role - send them to their landing dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'worker') {
      return <Navigate to="/captain/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
