import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  AppBar, Toolbar, Typography, Button, Container, Box,
  Avatar, Menu, MenuItem, IconButton, Tooltip, Grid, Divider, Link
} from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { gsap } from 'gsap';
import { buildMediaUrl } from '../services/api';

const CustomerLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  React.useEffect(() => {
    // Set initial hidden states
    gsap.set('.nav-logo-reveal', { opacity: 0, x: -20 });
    gsap.set('.nav-link-reveal', { opacity: 0, y: -10 });
    gsap.set('.nav-action-reveal', { opacity: 0, scale: 0.9 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
    tl.to('.nav-logo-reveal', { opacity: 1, x: 0 })
      .to('.nav-link-reveal', { opacity: 1, y: 0, stagger: 0.1 }, '-=0.5')
      .to('.nav-action-reveal', { opacity: 1, scale: 1, stagger: 0.1 }, '-=0.4');
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/home');
  };

  const getDashboardRoute = () => {
    if (!user) return '/home';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'worker') return '/captain/dashboard';
    return '/customer/dashboard';
  };

  const getProfileRoute = () => {
    if (!user) return '/home';
    if (user.role === 'worker') return '/captain/profile';
    return '/customer/profile';
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="#FAFAFB">
      {/* Glassmorphic Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E5E7EB',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            {/* Branding Logo */}
            <Box
              onClick={() => navigate('/home')}
              className="nav-logo-reveal"
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: '#ffffff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden'
                }}
              >
                <Box component="img" src="/logo.png" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
              </Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '.03rem',
                  color: '#0F0F14',
                  fontSize: '1.3rem'
                }}
              >
                WORKIZO
              </Typography>
            </Box>

            {/* Nav Menu Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="text"
                color="inherit"
                className="nav-link-reveal"
                onClick={() => navigate('/home')}
                sx={{ color: location.pathname === '/home' ? '#000000' : '#4B5563', fontWeight: 600 }}
              >
                Home
              </Button>


              {(!isAuthenticated || user?.role === 'customer') && (
                <>
                  <Button
                    variant="text"
                    color="inherit"
                    className="nav-link-reveal"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate('/customer/book');
                      } else {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', '/customer/book');
                        navigate('/customer/login');
                      }
                    }}
                    sx={{ color: location.pathname.includes('/book') ? '#000000' : '#4B5563', fontWeight: 600 }}
                  >
                    Book Service
                  </Button>
                </>
              )}

              {(!isAuthenticated || user?.role === 'admin') && (
                <Button
                  variant="text"
                  color="inherit"
                  className="nav-link-reveal"
                  onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/admin/login')}
                  sx={{ color: location.pathname.includes('/admin') ? '#000000' : '#4B5563', fontWeight: 600 }}
                >
                  Admin
                </Button>
              )}

              {/* Become a Captain button - styled in Workizo black outlined pill button */}
              {!isAuthenticated && (
                <Button
                  variant="outlined"
                  className="nav-link-reveal"
                  onClick={() => navigate('/captain/login')}
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    borderRadius: '24px',
                    fontWeight: 'bold',
                    px: 3,
                    py: 0.8,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#222222',
                      bgcolor: 'rgba(0,0,0,0.04)'
                    }
                  }}
                >
                  Become a Captain
                </Button>
              )}

              {isAuthenticated ? (
                <>
                  {user?.role !== 'customer' && (
                    <Button
                      variant="text"
                      color="inherit"
                      className="nav-link-reveal"
                      onClick={() => navigate(getDashboardRoute())}
                      sx={{ color: location.pathname.includes('/dashboard') ? '#000000' : '#4B5563', fontWeight: 600 }}
                    >
                      Dashboard
                    </Button>
                  )}

                  <Tooltip title="Account Settings">
                    <IconButton className="nav-action-reveal" onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
                      <Avatar
                        src={buildMediaUrl(user.profile_photo)}
                        sx={{ bgcolor: '#000000', width: 36, height: 36 }}
                      >
                        {user.full_name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 180,
                        backgroundColor: '#ffffff',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                      }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
                      <Typography variant="subtitle2" noWrap fontWeight={700}>
                        {user.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user.email}
                      </Typography>
                    </Box>
                    <MenuItem onClick={() => { handleMenuClose(); navigate(getDashboardRoute()); }}>
                      <DashboardIcon fontSize="small" sx={{ mr: 1.5, color: '#6B7280' }} />
                      Dashboard
                    </MenuItem>
                    {user.role !== 'admin' && (
                      <MenuItem onClick={() => { handleMenuClose(); navigate(getProfileRoute()); }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#6B7280' }} />
                        Profile Settings
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#ef4444' }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  className="nav-action-reveal"
                  onClick={() => navigate('/customer/login')}
                  sx={{ borderRadius: '24px', px: 3 }}
                >
                  Login / Sign Up
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Page Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#F4F6F9' }}>
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 8,
          px: 2,
          mt: 'auto',
          backgroundColor: '#111111',
          color: '#FFFFFF',
          borderTop: '1px solid #222222'
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: { xs: 4, sm: 3, md: 4 },
              flexWrap: 'wrap'
            }}
          >
            {/* Column 1: Brand Info & Socials */}
            <Box sx={{ flex: '1 1 250px', minWidth: '220px', maxWidth: '300px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
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
                    overflow: 'hidden'
                  }}
                >
                  <Box component="img" src="/logo.png" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
                </Box>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 900,
                    letterSpacing: '.03rem',
                    color: '#ffffff',
                    fontSize: '1.3rem'
                  }}
                >
                  WORKIZO
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3, lineHeight: 1.6 }}>
                Fast, reliable, and affordable home and professional services at your doorstep. Your satisfaction is our top priority.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {[
                  { icon: <FacebookIcon sx={{ fontSize: 20 }} />, url: 'https://facebook.com' },
                  { icon: <TwitterIcon sx={{ fontSize: 20 }} />, url: 'https://twitter.com' },
                  { icon: <InstagramIcon sx={{ fontSize: 20 }} />, url: 'https://instagram.com' },
                  { icon: <LinkedInIcon sx={{ fontSize: 20 }} />, url: 'https://linkedin.com' }
                ].map((social, idx) => (
                  <IconButton
                    key={idx}
                    component="a"
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#9CA3AF',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        color: '#ffffff',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      width: 36,
                      height: 36
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>

            {/* Column 2: Quick Links */}
            <Box sx={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '200px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { text: 'Home', path: '/home' },
                  {
                    text: 'Book Service', path: '/customer/book', action: () => {
                      if (isAuthenticated) {
                        navigate('/customer/book');
                      } else {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', '/customer/book');
                        navigate('/customer/login');
                      }
                    }
                  },
                  { text: 'Become a Captain', path: '/captain/login' },
                  { text: 'Admin Login', path: '/admin/login' }
                ].map((link, idx) => (
                  <Link
                    key={idx}
                    component="button"
                    onClick={() => {
                      if (link.action) {
                        link.action();
                      } else {
                        navigate(link.path);
                      }
                    }}
                    underline="none"
                    sx={{
                      color: '#9CA3AF',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#ffffff',
                      },
                      transition: 'color 0.2s ease-in-out',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      fontFamily: 'inherit'
                    }}
                  >
                    {link.text}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Column 3: Services */}
            <Box sx={{ flex: '1 1 150px', minWidth: '150px', maxWidth: '200px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Services
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  'Electrician',
                  'Plumber',
                  'Carpenter',
                  'AC Technician',
                  'Mechanic',
                  'Home Cleaning'
                ].map((service, idx) => (
                  <Link
                    key={idx}
                    component="button"
                    onClick={() => {
                      if (isAuthenticated) {
                        navigate('/customer/book');
                      } else {
                        toast.error('Please log in first to book a service');
                        localStorage.setItem('redirect_after_login', '/customer/book');
                        navigate('/customer/login');
                      }
                    }}
                    underline="none"
                    sx={{
                      color: '#9CA3AF',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#ffffff',
                      },
                      transition: 'color 0.2s ease-in-out',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      fontFamily: 'inherit'
                    }}
                  >
                    {service}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Column 4: Contact Us */}
            <Box sx={{ flex: '1 1 250px', minWidth: '220px', maxWidth: '300px' }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#ffffff', mb: 2.5, fontFamily: 'Outfit' }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <PhoneIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                    +91 9876543210
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <EmailIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF', wordBreak: 'break-all' }}>
                    support@workizo.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <LocationOnIcon sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#9CA3AF', lineHeight: 1.5, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    SIGNATURE-2, C-909, Sarkhej - Sanand Rd,<br />
                    Makarba, Sarkhej-Okaf, Ahmedabad,<br />
                    Gujarat 382210
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 5, borderColor: '#222222' }} />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              © {new Date().getFullYear()} Workizo. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', textAlign: { xs: 'center', sm: 'right' } }}>
              Built with Django & React. Secure JWT Authentication. Role-Based Access Control.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default CustomerLayout;
