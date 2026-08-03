import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const CaptainRouteWrapper = ({ children, requireApproved }) => {
  const { user, loading, isAuthenticated } = useAuth();

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
          Checking credentials, please wait...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated || user?.role !== 'worker') {
    return <Navigate to="/captain/login" replace />;
  }

  const isApproved = user?.profile?.approval_status === 'approved';
  // Check if they have submitted onboarding details.
  // service_category is selected during onboarding, so if it exists, it indicates they completed submission.
  const hasSubmitted = !!user?.profile?.service_category;

  if (requireApproved) {
    if (!isApproved) {
      if (user?.profile?.approval_status === 'rejected' || !hasSubmitted) {
        return <Navigate to="/captain/onboarding" replace />;
      }
      return <Navigate to="/captain/waiting" replace />;
    }
  } else {
    // Non-approved routes (onboarding and waiting)
    if (isApproved) {
      return <Navigate to="/captain/dashboard" replace />;
    }
    
    const currentPath = window.location.pathname;
    if (currentPath === '/captain/waiting') {
      if (!hasSubmitted || user?.profile?.approval_status === 'rejected') {
        return <Navigate to="/captain/onboarding" replace />;
      }
    } else if (currentPath === '/captain/onboarding') {
      if (hasSubmitted && user?.profile?.approval_status === 'pending') {
        return <Navigate to="/captain/waiting" replace />;
      }
    }
  }

  return children;
};

export default CaptainRouteWrapper;
