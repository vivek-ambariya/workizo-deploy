import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Tooltip,
  Menu, MenuItem, useTheme, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import HandymanIcon from '@mui/icons-material/Handyman';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import { tokens } from '../design/tokens';


const drawerWidth = 260;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Dynamic desktop drawer width
  const currentDrawerWidth = isCollapsed ? 80 : 260;

  // Parse active tab from URL query params
  const queryParams = new URLSearchParams(location.search);
  const tabQuery = queryParams.get('tab') || 'dashboard';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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
    navigate('/admin/login');
  };

  const menuItems = [
    { text: 'Dashboard', tab: 'dashboard', icon: <DashboardIcon /> },
    { text: 'Bookings', tab: 'bookings', icon: <ReceiptLongIcon /> },
    { text: 'Workers', tab: 'workers', icon: <SupervisorAccountIcon /> },
    { text: 'Customers', tab: 'customers', icon: <PeopleIcon /> },
    { text: 'Service Categories', tab: 'categories', icon: <CategoryIcon /> },
    { text: 'Payments', tab: 'payments', icon: <PaymentIcon /> },
    { text: 'Bills', tab: 'bills', icon: <ReceiptIcon /> },
    { text: 'Ratings & Reviews', tab: 'reviews', icon: <StarIcon /> },
    { text: 'Reports & Analytics', tab: 'reports', icon: <BarChartIcon /> },
    { text: 'Notifications', tab: 'notifications', icon: <CampaignIcon /> },
    { text: 'System Settings', tab: 'settings', icon: <SettingsIcon /> },
    { text: 'Profile', tab: 'profile', icon: <PersonIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff', color: '#0F0F14' }}>
      {/* Branding Logo & Collapse Button */}
      <Box 
        sx={{ 
          p: isCollapsed ? 2 : 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid #E5E7EB',
          height: '75px',
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          })
        }}
      >
        {!isCollapsed ? (
          <>
            <Box 
              onClick={() => navigate('/admin/dashboard?tab=dashboard')} 
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
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
                    color: '#0F0F14',
                    lineHeight: 1.2,
                    fontSize: '1.3rem'
                  }}
                >
                  WORKIZO
                </Typography>
                <Typography variant="caption" sx={{ color: '#1A73E8', letterSpacing: '.1rem', fontWeight: 600 }}>
                  ADMIN PORTAL
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setIsCollapsed(true)} 
              sx={{ 
                color: '#6E7280', 
                '&:hover': { color: '#000000', bgcolor: 'rgba(0,0,0,0.04)' } 
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <IconButton 
            onClick={() => setIsCollapsed(false)} 
            sx={{ 
              color: '#1A73E8', 
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } 
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ px: isCollapsed ? 1 : 1.5, py: 2, flexGrow: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = tabQuery === item.tab;
          return (
            <ListItem key={item.tab} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.text} placement="right" disableHoverListener={!isCollapsed}>
                <ListItemButton
                  onClick={() => {
                    navigate(`/admin/dashboard?tab=${item.tab}`);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '8px',
                    py: 1.2,
                    px: isCollapsed ? 1.5 : 2,
                    justifyContent: isCollapsed ? 'center' : 'initial',
                    backgroundColor: isActive ? 'rgba(26, 115, 232, 0.08)' : 'transparent',
                    color: isActive ? '#1A73E8' : '#4B5563',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      color: '#0F0F14'
                    },
                    transition: 'all 0.15s'
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#1A73E8' : '#6E7280', minWidth: isCollapsed ? 0 : 36, justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!isCollapsed && (
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#E5E7EB' }} />

      {/* Footer / Account Profile */}
      <Box 
        sx={{ 
          p: isCollapsed ? 1.5 : 2, 
          display: 'flex', 
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: isCollapsed ? 2 : 1.5, 
          borderTop: '1px solid #E5E7EB' 
        }}
      >
        <Avatar
          sx={{ bgcolor: '#1A73E8', width: 40, height: 40, fontWeight: 700 }}
        >
          {user?.full_name?.charAt(0).toUpperCase() || 'A'}
        </Avatar>
        
        {!isCollapsed ? (
          <>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#0F0F14' }}>
                {user?.full_name || 'Admin User'}
              </Typography>
              <Typography variant="caption" noWrap display="block" sx={{ color: '#6E7280' }}>
                System Administrator
              </Typography>
            </Box>
            <Tooltip title="Log Out" placement="bottom">
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
    <Box display="flex" minHeight="100vh" bgcolor={tokens.colors.bg}>
      {/* AppBar Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E5E7EB',
          color: '#0F0F14',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          <Box display="flex" alignItems="center">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <AdminPanelSettingsIcon sx={{ color: '#1A73E8', mr: 1, display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="subtitle1" fontWeight="700" sx={{ letterSpacing: '0.02em', display: { xs: 'none', sm: 'block' } }}>
              Workizo Administrative Panel
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Account Panel">
              <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                <Avatar
                  sx={{ bgcolor: '#1A73E8', width: 36, height: 36, fontWeight: 700 }}
                >
                  {user?.full_name?.charAt(0).toUpperCase() || 'A'}
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
                  minWidth: 160,
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/admin/dashboard?tab=profile'); }}>
                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: '#4B5563' }} />
                My Profile
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
        sx={{ 
          width: { md: 0 }, 
          flexShrink: { md: 0 }
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #E5E7EB' },
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
          bgcolor: tokens.colors.bg,
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

export default AdminLayout;
