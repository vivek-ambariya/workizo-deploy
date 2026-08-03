import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import {
  TextField, Button, Box, CircularProgress, Typography, Divider
} from '@mui/material';
import toast from 'react-hot-toast';
import { tokens } from '../design/tokens';

const AdminLogin = () => {
  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { 
    register: registerLogin, 
    handleSubmit: handleSubmitLogin, 
    formState: { errors: errorsLogin } 
  } = useForm();

  const { 
    register: registerSignup, 
    handleSubmit: handleSubmitSignup, 
    formState: { errors: errorsSignup } 
  } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        logout();
      }
    }
  }, [isAuthenticated, user, navigate, logout]);

  // Login handler
  const onLoginSubmit = async (data) => {
    setLoading(true);
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        await logout();
        toast.error('Access denied. This portal is only for administrators.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Register handler (restricted)
  const onRegisterSubmit = (data) => {
    toast.error("Admin registration is restricted. Please register via Django superuser / manage.py commands.");
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
      }}
    >
      {/* Main Sliding Card Container */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: '850px',
          minHeight: '620px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }
        }}
      >
        {/* Sign In Form Panel */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: '100%',
            minHeight: '620px',
            position: { xs: 'relative', md: 'absolute' },
            top: 0,
            left: 0,
            transition: 'all 0.6s ease-in-out',
            transform: { xs: 'none', md: isSignUp ? 'translateX(-100%)' : 'translateX(0)' },
            opacity: { xs: isSignUp ? 0 : 1, md: isSignUp ? 0 : 1 },
            zIndex: isSignUp ? 1 : 5,
            pointerEvents: isSignUp ? 'none' : 'auto',
            display: isSignUp ? { xs: 'none', md: 'flex' } : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <Box
              sx={{
                mx: 'auto',
                mb: 2,
                width: 44,
                height: 44,
                bgcolor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}
            >
              <Box component="img" src="/logo.png" alt="Workizo" sx={{ width: 38, height: 38, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0F0F14', mb: 1 }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              System administrators only
            </Typography>

            <Box component="form" onSubmit={handleSubmitLogin(onLoginSubmit)} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                id="admin-email"
                label="Admin Email Address"
                autoComplete="email"
                {...registerLogin('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={!!errorsLogin.email}
                helperText={errorsLogin.email?.message}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                name="password"
                label="Admin Password"
                type="password"
                id="admin-password"
                autoComplete="current-password"
                {...registerLogin('password', { required: 'Password is required' })}
                error={!!errorsLogin.password}
                helperText={errorsLogin.password?.message}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  bgcolor: tokens.colors.error,
                  color: '#ffffff',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: '#991B1B' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
              </Button>
            </Box>

            {/* Mobile-only toggle */}
            <Typography variant="body2" sx={{ display: { xs: 'block', md: 'none' }, mt: 4 }}>
              Looking to register?{' '}
              <span onClick={() => setIsSignUp(true)} style={{ color: tokens.colors.error, fontWeight: 700, cursor: 'pointer' }}>
                View Access Policy
              </span>
            </Typography>
          </Box>
        </Box>

        {/* Sign Up Form Panel (Restricted Alert) */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            height: '100%',
            minHeight: '620px',
            position: { xs: 'relative', md: 'absolute' },
            top: 0,
            left: { xs: 0, md: '50%' },
            transition: 'all 0.6s ease-in-out',
            transform: { xs: 'none', md: isSignUp ? 'translateX(0)' : 'translateX(100%)' },
            opacity: { xs: isSignUp ? 1 : 0, md: isSignUp ? 1 : 0 },
            zIndex: isSignUp ? 5 : 1,
            pointerEvents: isSignUp ? 'auto' : 'none',
            display: isSignUp ? 'flex' : { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 4, sm: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <Box
              sx={{
                mx: 'auto',
                mb: 2,
                width: 44,
                height: 44,
                bgcolor: '#ffffff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden'
              }}
            >
              <Box component="img" src="/logo.png" alt="Workizo" sx={{ width: 38, height: 38, objectFit: 'contain' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#DC2626', mb: 2 }}>
              Registration Restricted
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Admin registrations are disabled for security reasons. Access requires direct superuser clearance.
            </Typography>

            <Box component="form" onSubmit={handleSubmitSignup(onRegisterSubmit)} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                disabled
                fullWidth
                size="small"
                id="admin-reg-name"
                label="Full Name (Restricted)"
                sx={{ mb: 1.5 }}
              />
              <TextField
                margin="dense"
                disabled
                fullWidth
                size="small"
                id="admin-reg-email"
                label="Email Address (Restricted)"
                sx={{ mb: 1.5 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.2,
                  mt: 2,
                  bgcolor: '#9CA3AF',
                  color: '#ffffff',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#9CA3AF' }
                }}
              >
                Access Denied
              </Button>
            </Box>

            {/* Mobile-only toggle */}
            <Typography variant="body2" sx={{ display: { xs: 'block', md: 'none' }, mt: 4 }}>
              Have credentials?{' '}
              <span onClick={() => setIsSignUp(false)} style={{ color: tokens.colors.error, fontWeight: 700, cursor: 'pointer' }}>
                Sign In Here
              </span>
            </Typography>
          </Box>
        </Box>

        {/* Sliding Overlay Panel (Hidden on Mobile) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            overflow: 'hidden',
            transition: 'transform 0.6s ease-in-out',
            transform: isSignUp ? 'translateX(0)' : 'translateX(100%)',
            zIndex: 10,
            borderTopLeftRadius: isSignUp ? '24px' : '80px 50%',
            borderBottomLeftRadius: isSignUp ? '24px' : '80px 50%',
            borderTopRightRadius: isSignUp ? '80px 50%' : '24px',
            borderBottomRightRadius: isSignUp ? '80px 50%' : '24px',
          }}
        >
          {/* Internal background container translating in opposite direction */}
          <Box
            sx={{
              width: '200%',
              height: '100%',
              background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
              transition: 'transform 0.6s ease-in-out',
              transform: isSignUp ? 'translateX(0)' : 'translateX(-50%)',
              display: 'flex'
            }}
          >
            {/* Left Overlay Panel (Sign In Prompt) */}
            <Box
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ffffff',
                p: 6,
                textAlign: 'center',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', mb: 2 }}>
                System Console
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6, maxWidth: '280px' }}>
                Please sign in with your administrator dashboard credentials
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setIsSignUp(false)}
                sx={{
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  borderRadius: '30px',
                  px: 4,
                  py: 1,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderWidth: '2px',
                  '&:hover': {
                    borderWidth: '2px',
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>

            {/* Right Overlay Panel (Sign Up Prompt) */}
            <Box
              sx={{
                width: '50%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#ffffff',
                p: 6,
                textAlign: 'center',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', mb: 2 }}>
                Registration
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6, maxWidth: '280px' }}>
                Review access credentials and security policies for administrators
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setIsSignUp(true)}
                sx={{
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  borderRadius: '30px',
                  px: 4,
                  py: 1,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderWidth: '2px',
                  '&:hover': {
                    borderWidth: '2px',
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                View Policy
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLogin;
