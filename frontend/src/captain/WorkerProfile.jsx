import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api, { buildMediaUrl } from '../services/api';
import {
  TextField, Button, Box, CircularProgress, Typography, Divider, Avatar
} from '@mui/material';
import toast from 'react-hot-toast';
import LogoutIcon from '@mui/icons-material/Logout';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard 
} from '../components/dashboard';

const WorkerProfile = () => {
  const { user, updateProfileState, logout } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // File Upload State
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, watch } = useForm();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      resetProfile({
        fullName: user.full_name,
        phone: user.phone,
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.fullName);
      formData.append('phone', data.phone);
      if (profilePhotoFile) {
        formData.append('profile_photo', profilePhotoFile);
      }

      const res = await api.put('accounts/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update profile state in context
      updateProfileState(res.data);
      setProfilePhotoFile(null);
      toast.success('Profile details updated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile details.');
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
      toast.error(err.response?.data?.old_password?.[0] || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/captain/login');
  };

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/captain/dashboard' },
        { label: 'Profile Settings' }
      ]}
      title="Profile Settings"
      description="Update your personal account information and security credentials."
      actions={
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Logout
        </Button>
      }
    >
      <DashboardGrid>
        {/* Account Information Form */}
        <Box sx={span.twoThirds}>
          <DashboardCard title="Account Details" subtitle="Edit your name, contact mobile, and profile picture">
            <Box component="form" onSubmit={handleSubmitProfile(onProfileSubmit)} noValidate sx={{ mt: 2 }}>
              <DashboardGrid sx={{ gap: 2.5 }}>
                
                {/* Full Name & Phone */}
                <Box sx={span.half}>
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
                    label="Mobile Number"
                    {...registerProfile('phone', { required: true })}
                  />
                </Box>

                {/* Email Address (disabled/read-only) */}
                <Box sx={span.full}>
                  <TextField
                    fullWidth
                    disabled
                    label="Email Address"
                    value={user?.email || ''}
                  />
                </Box>

                {/* Profile Photo Update */}
                <Box sx={span.full}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                    Profile Photo (Optional Update)
                  </Typography>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Avatar
                      src={profilePhotoFile ? URL.createObjectURL(profilePhotoFile) : buildMediaUrl(user?.profile_photo)}
                      sx={{ width: 64, height: 64, border: `1px solid ${tokens.borderColor}` }}
                    >
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Button variant="outlined" component="label" sx={{ textTransform: 'none', py: 1 }}>
                        Upload New Photo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                        />
                      </Button>
                      {profilePhotoFile && (
                        <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                          Selected: {profilePhotoFile.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
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
                {profileLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile Changes'}
              </Button>
            </Box>
          </DashboardCard>
        </Box>

        {/* Change Password / Security */}
        <Box sx={span.oneThird}>
          <DashboardCard title="Security Credentials" subtitle="Ensure your account is using a secure password">
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
                    label="Confirm Password"
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
                {passwordLoading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
              </Button>
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
};

export default WorkerProfile;
