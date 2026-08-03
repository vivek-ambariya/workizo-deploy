import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import {
  TextField, Button, Box, CircularProgress
} from '@mui/material';
import toast from 'react-hot-toast';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard 
} from '../components/dashboard';

const CustomerProfile = () => {
  const { user, updateProfileState } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, watch } = useForm();

  const newPassword = watch('newPassword');

  // Pre-fill profile form fields
  useEffect(() => {
    if (user) {
      resetProfile({
        fullName: user.full_name,
        phone: user.phone,
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        pincode: user.profile?.pincode || '',
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const res = await api.put('accounts/profile/', {
        full_name: data.fullName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode
      });
      updateProfileState(res.data);
      toast.success('Profile details updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await api.post('accounts/change-password/', {
        old_password: data.oldPassword,
        new_password: data.newPassword
      });
      toast.success('Password changed successfully.');
      resetPassword();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.old_password?.[0] || 'Failed to change password. Double check current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/customer/dashboard' },
        { label: 'Profile Settings' }
      ]}
      title="Profile Settings"
      description="Update your account details and contact address"
    >
      <DashboardGrid>
        {/* Profile Info Form */}
        <Box sx={span.twoThirds}>
          <DashboardCard
            title="Account Information"
            subtitle="Update your name, contact phone, and service location details"
          >
            <Box component="form" onSubmit={handleSubmitProfile(onProfileSubmit)} noValidate sx={{ mt: 2 }}>
              <DashboardGrid sx={{ gap: 2.5 }}>
                <Box sx={span.full}>
                  <TextField
                    required
                    fullWidth
                    label="Full Name"
                    {...registerProfile('fullName', { required: true })}
                  />
                </Box>
                <Box sx={span.half}>
                  <TextField
                    required
                    fullWidth
                    label="Email Address"
                    disabled
                    value={user?.email || ''}
                  />
                </Box>
                <Box sx={span.half}>
                  <TextField
                    required
                    fullWidth
                    label="Phone Number"
                    {...registerProfile('phone', { required: true })}
                  />
                </Box>
                <Box sx={span.full}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Street Address"
                    {...registerProfile('address')}
                  />
                </Box>
                <Box sx={span.third}>
                  <TextField
                    fullWidth
                    label="City"
                    {...registerProfile('city')}
                  />
                </Box>
                <Box sx={span.third}>
                  <TextField
                    fullWidth
                    label="State"
                    {...registerProfile('state')}
                  />
                </Box>
                <Box sx={span.third}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    {...registerProfile('pincode')}
                  />
                </Box>
              </DashboardGrid>

              <Button
                type="submit"
                variant="contained"
                disabled={profileLoading}
                sx={{ 
                  mt: 4, 
                  py: 1.25, 
                  px: 4,
                  bgcolor: tokens.colors.primary, 
                  color: '#ffffff', 
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#23232F' }
                }}
              >
                {profileLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </Box>
          </DashboardCard>
        </Box>

        {/* Change Password Form */}
        <Box sx={span.oneThird}>
          <DashboardCard
            title="Change Password"
            subtitle="Ensure your account is using a secure password"
          >
            <Box component="form" onSubmit={handleSubmitPassword(onPasswordSubmit)} noValidate sx={{ mt: 2 }}>
              <DashboardGrid sx={{ gap: 2.5 }}>
                <Box sx={span.full}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    label="Current Password"
                    {...registerPassword('oldPassword', { required: true })}
                  />
                </Box>
                <Box sx={span.full}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    label="New Password"
                    {...registerPassword('newPassword', { required: true, minLength: 6 })}
                  />
                </Box>
                <Box sx={span.full}>
                  <TextField
                    required
                    fullWidth
                    type="password"
                    label="Confirm New Password"
                    {...registerPassword('confirmNewPassword', {
                      required: true,
                      validate: (v) => v === newPassword || 'Passwords do not match'
                    })}
                  />
                </Box>
              </DashboardGrid>

              <Button
                type="submit"
                variant="contained"
                disabled={passwordLoading}
                sx={{ 
                  mt: 4, 
                  py: 1.25, 
                  px: 4,
                  bgcolor: tokens.colors.error, 
                  color: '#ffffff', 
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#B91C1C' }
                }}
              >
                {passwordLoading ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
              </Button>
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
};

export default CustomerProfile;
