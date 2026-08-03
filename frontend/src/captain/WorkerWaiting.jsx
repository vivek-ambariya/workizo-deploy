import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Box, Button, Typography, Paper, AppBar, Toolbar, CircularProgress, Card, CardContent
} from '@mui/material';
import toast from 'react-hot-toast';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import BlockIcon from '@mui/icons-material/Block';

import { tokens } from '../design/tokens';

const WorkerWaiting = () => {
  const { user, updateProfileState, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/captain/login');
  };

  const handleRefreshStatus = async () => {
    setChecking(true);
    try {
      const res = await api.get('accounts/me/');
      updateProfileState(res.data);
      
      const newStatus = res.data.profile?.approval_status;
      if (newStatus === 'approved') {
        toast.success('Congratulations! Your account is approved.');
        navigate('/captain/dashboard');
      } else if (newStatus === 'rejected') {
        toast.error('Your KYC documents were rejected. Please update details.');
        navigate('/captain/onboarding');
      } else {
        toast.success('Your profile is still under review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.colors.bg, pb: 6 }}>
      {/* Topbar */}
      <AppBar position="static" elevation={0} sx={{ background: '#0F0F14', borderBottom: '1px solid #1E1E24', height: 'auto' }}>
        <Toolbar 
          disableGutters
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 3, sm: 4 }
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <Box component="img" src="/logo.png" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 900, color: '#ffffff', lineHeight: 1.1, fontSize: '1.25rem', letterSpacing: '.03rem' }}>
                WORKIZO
              </Typography>
              <Typography variant="caption" sx={{ color: '#888888', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.1 }}>
                Captain Portal
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ color: '#ef4444', textTransform: 'none', fontWeight: 700 }}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Waiting Screen Card */}
      <Box sx={{ maxWidth: '550px', mx: 'auto', mt: 8, px: 2 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 4, sm: 5 }, 
            borderRadius: `${tokens.borderRadius}px`, 
            border: `1px solid ${tokens.borderColor}`, 
            textAlign: 'center',
            boxShadow: tokens.shadow
          }}
        >
          {/* Animated Hourglass Icon */}
          <Box 
            sx={{ 
              display: 'inline-flex', 
              p: 2.5, 
              bgcolor: 'rgba(217, 119, 6, 0.08)', 
              borderRadius: '50%', 
              mb: 3,
              animation: 'pulse 2s infinite'
            }}
          >
            <HourglassEmptyIcon sx={{ color: tokens.colors.warning, fontSize: 48 }} />
          </Box>

          <Typography 
            variant="h4" 
            fontWeight={900} 
            sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary, mb: 1.5 }}
          >
            Verification Submitted
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem', lineHeight: 1.5 }}>
            Your documents are under review by our administration team.
          </Typography>

          {/* Current Status Box */}
          <Box 
            sx={{ 
              py: 2, 
              px: 3, 
              bgcolor: 'rgba(217, 119, 6, 0.05)', 
              borderRadius: `${tokens.borderRadiusSm}px`,
              border: '1px dashed rgba(217, 119, 6, 0.25)',
              mb: 4,
              display: 'inline-block'
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Current Status
            </Typography>
            <Typography variant="h6" color={tokens.colors.warning} sx={{ fontWeight: 800, mt: 0.5 }}>
              Pending Approval
            </Typography>
          </Box>

          {/* Locked Features Alert */}
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: '#F9FAFB', 
              border: `1px solid ${tokens.borderColor}`, 
              borderRadius: `${tokens.borderRadiusSm}px`,
              mb: 4,
              textAlign: 'left'
            }}
          >
            <CardContent sx={{ display: 'flex', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <BlockIcon sx={{ color: tokens.colors.error, mt: 0.25 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="error" sx={{ mb: 0.5 }}>
                  Access Restricted
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>
                  You cannot access the <b>Dashboard</b>, <b>Wallet</b>, <b>Job history</b>, <b>Earnings</b>, or receive <b>Service Requests</b> until the administrator approves your profile.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              variant="contained"
              onClick={handleRefreshStatus}
              disabled={checking}
              startIcon={checking ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              sx={{
                py: 1.5,
                bgcolor: tokens.colors.primary,
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: `${tokens.borderRadiusSm}px`,
                textTransform: 'none',
                '&:hover': { bgcolor: '#23232F' }
              }}
            >
              {checking ? 'Checking Status...' : 'Refresh Status'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default WorkerWaiting;
