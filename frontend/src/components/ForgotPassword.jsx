import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  TextField, Button, Box, Link, CircularProgress, Typography
} from '@mui/material';
import toast from 'react-hot-toast';
import { tokens } from '../design/tokens';
import { AuthPageShell } from './dashboard';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Demo Mode: A mock password reset link has been sent to ${data.email}`);
      navigate('/');
    }, 1200);
  };

  return (
    <AuthPageShell
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a recovery link"
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1, width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          autoComplete="email"
          autoFocus
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{
            py: 1.2,
            mt: 2,
            mb: 2,
            bgcolor: tokens.colors.primary,
            color: '#ffffff',
            borderRadius: `${tokens.borderRadiusSm}px`,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#23232F' }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
        </Button>

        <Box display="flex" justifyContent="center">
          <Link component={RouterLink} to="/" color="primary" fontWeight={600}>
            Back to Home
          </Link>
        </Box>
      </Box>
    </AuthPageShell>
  );
};

export default ForgotPassword;
