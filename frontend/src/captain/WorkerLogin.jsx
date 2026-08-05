import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import {
  TextField, Button, Box, Link, CircularProgress, Typography, Divider
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { tokens } from '../design/tokens';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1015380078872-icsaqkdfq5dhehn137rq0k0dhi4omepa.apps.googleusercontent.com";

const WorkerLogin = ({ defaultSignUp = false }) => {
  const { login, logout, isAuthenticated, user, googleLogin, register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);

  // Sync state if defaultSignUp prop changes
  useEffect(() => {
    setIsSignUp(defaultSignUp);
  }, [defaultSignUp]);

  const { 
    register: registerLogin, 
    handleSubmit: handleSubmitLogin, 
    formState: { errors: errorsLogin } 
  } = useForm();

  const { 
    register: registerSignup, 
    handleSubmit: handleSubmitSignup, 
    watch: watchSignup, 
    formState: { errors: errorsSignup } 
  } = useForm();

  const signupPassword = watchSignup('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'worker') {
        navigate('/captain/dashboard');
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
      if (loggedUser.role === 'worker') {
        navigate('/captain/dashboard');
      } else {
        await logout();
        toast.error('This portal is only for Captains. Please log in on the Customer Portal.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const onRegisterSubmit = async (data) => {
    setLoading(true);
    try {
      await registerAuth(data.fullName, data.email, data.phone, data.password, 'worker');
      toast.success('Registration successful! Please complete your profile and KYC details.');
      navigate('/captain/onboarding');
    } catch (err) {
      console.error(err);
      if (err.email) {
        toast.error(`Email: ${err.email[0]}`);
      } else if (err.phone) {
        toast.error(`Phone: ${err.phone[0]}`);
      } else {
        toast.error(err.detail || 'Registration failed. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google authentication handlers
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const loggedUser = await googleLogin(credentialResponse.credential, 'worker');
      if (loggedUser.role === 'worker') {
        toast.success('Registration successful! Please complete your profile and KYC details.');
        navigate('/captain/onboarding');
      } else {
        await logout();
        toast.error('This portal is only for Captains. Please log in on the Customer Portal.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setLoading(true);
    try {
      const email = prompt("Enter mock Google email:", "captaintest@workizo.com");
      if (!email) {
        setLoading(false);
        return;
      }
      const name = prompt("Enter mock Google Full Name:", "Google Captain");
      if (!name) {
        setLoading(false);
        return;
      }
      const dashedName = name.replace(/\s+/g, '-');
      const mockToken = `mock_token_worker_${email}_${dashedName}`;
      
      const loggedUser = await googleLogin(mockToken, 'worker');
      if (loggedUser.role === 'worker') {
        toast.success('Registration successful! Please complete your profile and KYC details.');
        navigate('/captain/onboarding');
      } else {
        await logout();
        toast.error('This portal is only for Captains. Please log in on the Customer Portal.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              Captain Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage your bookings, online status, and verification
            </Typography>

            <Box component="form" onSubmit={handleSubmitLogin(onLoginSubmit)} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                id="login-email"
                label="Email Address"
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
                sx={{ mb: 1.5 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                name="password"
                label="Password"
                type="password"
                id="login-password"
                autoComplete="current-password"
                {...registerLogin('password', { required: 'Password is required' })}
                error={!!errorsLogin.password}
                helperText={errorsLogin.password?.message}
                sx={{ mb: 1 }}
              />

              <Box display="flex" justifyContent="flex-start" sx={{ mb: 2 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1,
                  mb: 2,
                  bgcolor: tokens.colors.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: '#23232F' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 2, fontSize: '0.8rem', color: 'text.secondary' }}>or use Google</Divider>

            {googleClientId && googleClientId !== 'MOCK_CLIENT_ID' ? (
              <Box display="flex" justifyContent="center" width="100%" mb={2}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Sign-In failed.")}
                  text="signin_with"
                  width="340"
                />
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleMockGoogleLogin}
                disabled={loading}
                sx={{
                  py: 1,
                  mb: 2,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' }
                }}
              >
                Continue with Google
              </Button>
            )}

            {/* Mobile-only toggle */}
            <Typography variant="body2" sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
              Don't have an account?{' '}
              <span onClick={() => setIsSignUp(true)} style={{ color: tokens.colors.primary, fontWeight: 700, cursor: 'pointer' }}>
                Register As Captain
              </span>
            </Typography>
          </Box>
        </Box>

        {/* Sign Up Form Panel */}
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
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0F0F14', mb: 1 }}>
              Become a Captain
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Earn money by offering services near you
            </Typography>

            <Box component="form" onSubmit={handleSubmitSignup(onRegisterSubmit)} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                id="reg-fullName"
                label="Full Name"
                {...registerSignup('fullName', { required: 'Full name is required' })}
                error={!!errorsSignup.fullName}
                helperText={errorsSignup.fullName?.message}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                id="reg-email"
                label="Email Address"
                autoComplete="email"
                {...registerSignup('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={!!errorsSignup.email}
                helperText={errorsSignup.email?.message}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                id="reg-phone"
                label="Phone Number"
                {...registerSignup('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Enter a valid 10-digit phone number'
                  }
                })}
                error={!!errorsSignup.phone}
                helperText={errorsSignup.phone?.message}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                name="password"
                label="Password"
                type="password"
                id="reg-password"
                {...registerSignup('password', { required: 'Password is required' })}
                error={!!errorsSignup.password}
                helperText={errorsSignup.password?.message}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="dense"
                required
                fullWidth
                size="small"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="reg-confirmPassword"
                {...registerSignup('confirmPassword', { 
                  required: 'Confirm password is required',
                  validate: value => value === signupPassword || 'Passwords do not match'
                })}
                error={!!errorsSignup.confirmPassword}
                helperText={errorsSignup.confirmPassword?.message}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1,
                  mb: 2,
                  bgcolor: tokens.colors.primary,
                  color: '#ffffff',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: '#23232F' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
              </Button>
            </Box>

            <Divider sx={{ my: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>or use Google</Divider>

            {googleClientId && googleClientId !== 'MOCK_CLIENT_ID' ? (
              <Box display="flex" justifyContent="center" width="100%" mb={2}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Sign-In failed.")}
                  text="signup_with"
                  width="340"
                />
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleMockGoogleLogin}
                disabled={loading}
                sx={{
                  py: 1,
                  mb: 2,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' }
                }}
              >
                Continue with Google
              </Button>
            )}

            {/* Mobile-only toggle */}
            <Typography variant="body2" sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
              Already have an account?{' '}
              <span onClick={() => setIsSignUp(false)} style={{ color: tokens.colors.primary, fontWeight: 700, cursor: 'pointer' }}>
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
              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
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
                Welcome Back!
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6, maxWidth: '280px' }}>
                Keep in touch with us by logging in with your Captain credentials
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
                Hello, Friend!
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6, maxWidth: '280px' }}>
                Join the Workizo fleet as a service partner and grow your business
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
                Sign Up
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkerLogin;
