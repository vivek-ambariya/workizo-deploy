import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Switch,
  FormControlLabel, Tooltip, Menu, MenuItem, useTheme, useMediaQuery, Badge
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api, { buildMediaUrl } from '../services/api';
import toast from 'react-hot-toast';

const drawerWidth = 260;

const CaptainLayout = () => {
  const { user, logout, updateProfileState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const isOnline = !!user?.profile?.online_status;
  
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const res = await api.get('accounts/me/');
        updateProfileState(res.data);
      } catch (err) {
        console.error("Error fetching fresh profile in CaptainLayout", err);
      }
    };
    fetchFreshProfile();
  }, []);

  // Dynamic desktop drawer width
  const currentDrawerWidth = isCollapsed ? 80 : 260;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOnlineToggle = async (event) => {
    setTogglingOnline(true);
    const newStatus = event.target.checked;
    try {
      const res = await api.put('accounts/profile/', {
        online_status: newStatus
      });
      updateProfileState(res.data);
      toast.success(newStatus ? 'You are now ONLINE! Listening for requests.' : 'You are now OFFLINE.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update online status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/captain/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/captain/dashboard' },
    { text: 'Job History', icon: <HistoryIcon />, path: '/captain/history' },
    { text: 'Wallet Ledger', icon: <AccountBalanceWalletIcon />, path: '/captain/wallet' },
    { text: 'Profile Settings', icon: <PersonIcon />, path: '/captain/profile' },
    { text: 'System Settings', icon: <SettingsIcon />, path: '/captain/settings' },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0F0F14', color: '#ffffff' }}>
      {/* Branding Logo & Collapse Trigger */}
      <Box 
        sx={{ 
          p: isCollapsed ? 2 : 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #1E1E24',
          height: '75px'
        }}
      >
        {!isCollapsed ? (
          <>
            <Box 
              onClick={() => navigate('/captain/dashboard')} 
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
                  boxShadow: '0 2px 8px rgba(255, 255, 255, 0.15)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <Box component="img" src="/logo.png" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '.03rem',
                    color: '#ffffff',
                    lineHeight: 1.2,
                    fontSize: '1.3rem'
                  }}
                >
                  WORKIZO
                </Typography>
                <Typography variant="caption" sx={{ color: '#888888', letterSpacing: '.1rem', fontWeight: 600 }}>
                  CAPTAIN PANEL
                </Typography>
              </Box>
            </Box>
            {!isMobile && (
              <IconButton 
                onClick={() => setIsCollapsed(true)} 
                sx={{ 
                  color: '#9CA3AF', 
                  '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.08)' } 
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            )}
          </>
        ) : (
          <IconButton 
            onClick={() => setIsCollapsed(false)} 
            sx={{ 
              color: '#3b82f6', 
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' } 
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ px: isCollapsed ? 1 : 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <Tooltip title={item.text} placement="right" disableHoverListener={!isCollapsed}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '8px',
                    py: 1.2,
                    px: isCollapsed ? 1.5 : 2,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    backgroundColor: isActive ? 'rgba(26, 115, 232, 0.15)' : 'transparent',
                    color: isActive ? '#3b82f6' : '#9CA3AF',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#3b82f6' : '#9CA3AF', minWidth: isCollapsed ? 0 : 40, justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 500 }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#1E1E24' }} />

      {/* Footer / Account Profile */}
      <Box 
        sx={{ 
          p: isCollapsed ? 1.5 : 2.5, 
          display: 'flex', 
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: isCollapsed ? 2 : 1.5, 
          borderTop: '1px solid #1E1E24' 
        }}
      >
        <Avatar
          src={buildMediaUrl(user?.profile?.profile_photo)}
          sx={{ bgcolor: '#1A73E8', width: 40, height: 40, fontWeight: 700 }}
        >
          {user?.full_name?.charAt(0).toUpperCase()}
        </Avatar>
        
        {!isCollapsed ? (
          <>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ color: '#888888' }}>
                Captain
              </Typography>
            </Box>
            <Tooltip title="Log Out">
              <IconButton onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Log Out" placement="right">
            <IconButton onClick={handleLogout} sx={{ color: '#ef4444', p: 0.5 }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Box display="flex" minHeight="100vh" bgcolor="#FAFAFB">
      {/* AppBar Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E5E7EB',
          color: '#0F0F14',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Online Status Toggle Switch in header */}
            <Tooltip title={user?.profile?.approval_status !== 'approved' ? "KYC verification pending admin approval" : ""}>
              <span>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOnline}
                      onChange={handleOnlineToggle}
                      disabled={togglingOnline || user?.profile?.approval_status !== 'approved'}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#1A73E8',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#1A73E8',
                            opacity: 0.9,
                          },
                        },
                      }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </Typography>
                      {isOnline && (
                        <Box sx={{
                          width: 6, height: 6, bgcolor: 'success.main', borderRadius: '50%', ml: 1,
                          animation: 'pulse 1.5s infinite'
                        }} />
                      )}
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </span>
            </Tooltip>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {/* Wallet quick balance */}
            <Box 
              sx={{ 
                display: { xs: 'none', sm: 'flex' }, 
                alignItems: 'center', 
                gap: 1, 
                px: 2, 
                py: 0.8, 
                borderRadius: '20px', 
                bgcolor: 'rgba(26, 115, 232, 0.08)',
                border: '1px solid rgba(26, 115, 232, 0.15)',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/captain/wallet')}
            >
              <AccountBalanceWalletIcon sx={{ color: '#1A73E8', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A73E8' }}>
                ₹{user?.profile?.wallet_balance || '0.00'}
              </Typography>
            </Box>

            {/* Notification Badge */}
            <IconButton color="inherit" onClick={() => navigate('/captain/dashboard')}>
              <Badge color="error" variant="dot">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Avatar Dropdown */}
            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                src={buildMediaUrl(user?.profile?.profile_photo)}
                sx={{ bgcolor: '#1A73E8', width: 36, height: 36, fontWeight: 700 }}
              >
                {user?.full_name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 160,
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/captain/profile'); }}>
                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#6B7280' }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/captain/settings'); }}>
                <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: '#6B7280' }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: '#ef4444' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #1E1E24' },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth, 
              borderRight: '1px solid #E5E7EB',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Page Layout Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          mt: '64px',
          bgcolor: '#F4F6F9',
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          minWidth: 0
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default CaptainLayout;
