import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Button, Typography, List, ListItem, ListItemText,
  InputBase, Grid, Chip, CircularProgress, Paper, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import api from '../services/api';
import toast from 'react-hot-toast';
import DownloadIcon from '@mui/icons-material/Download';


import HandymanIcon from '@mui/icons-material/Handyman';
import RoomIcon from '@mui/icons-material/Room';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import OpacityIcon from '@mui/icons-material/Opacity';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ConstructionIcon from '@mui/icons-material/Construction';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import SearchIcon from '@mui/icons-material/Search';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

import { tokens, span } from '../design/tokens';
import {
  DashboardPage, DashboardGrid, DashboardCard
} from '../components/dashboard';

// ─── Category styles ──────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  'Electrician': {
    icon: <FlashOnIcon sx={{ fontSize: 28, color: '#f59e0b' }} />,
    bgColor: 'rgba(245, 158, 11, 0.10)',
    borderColor: '#f59e0b',
  },
  'Plumber': {
    icon: <OpacityIcon sx={{ fontSize: 28, color: '#3b82f6' }} />,
    bgColor: 'rgba(59, 130, 246, 0.10)',
    borderColor: '#3b82f6',
  },
  'Carpenter': {
    icon: <CarpenterIcon sx={{ fontSize: 28, color: '#10b981' }} />,
    bgColor: 'rgba(16, 185, 129, 0.10)',
    borderColor: '#10b981',
  },
  'AC Technician': {
    icon: <AcUnitIcon sx={{ fontSize: 28, color: '#06b6d4' }} />,
    bgColor: 'rgba(6, 182, 212, 0.10)',
    borderColor: '#06b6d4',
  },
  'Mechanic': {
    icon: <ConstructionIcon sx={{ fontSize: 28, color: '#ef4444' }} />,
    bgColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: '#ef4444',
  },
  'Home Cleaning': {
    icon: <CleaningServicesIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />,
    bgColor: 'rgba(139, 92, 246, 0.10)',
    borderColor: '#8b5cf6',
  }
};

const CITIES = ['Ahmedabad', 'Mumbai', 'Delhi NCR', 'Bangalore', 'Pune', 'Surat', 'Vadodara'];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    searching:        { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.2)'    },
    accepted:         { color: '#1A73E8', bg: 'rgba(26,115,232,0.08)', border: 'rgba(26,115,232,0.2)'   },
    on_the_way:       { color: '#1A73E8', bg: 'rgba(26,115,232,0.08)', border: 'rgba(26,115,232,0.2)'   },
    arrived:          { color: '#0891b2', bg: 'rgba(8,145,178,0.08)',  border: 'rgba(8,145,178,0.2)'    },
    inspection:       { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)'   },
    repair_started:   { color: '#D97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.2)'   },
    repair_completed: { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)'   },
    completed:        { color: '#16A34A', bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.2)'   },
    cancelled:        { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.2)'   },
  };
  const s = map[status] || { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center',
      px: 1.5, py: 0.4,
      borderRadius: '20px',
      bgcolor: s.bg,
      border: `1px solid ${s.border}`,
      flexShrink: 0,
    }}>
      <Typography variant="caption" sx={{ color: s.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {status.replace(/_/g, ' ')}
      </Typography>
    </Box>
  );
}

// Helpers
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const getCardTimelineProgress = (status) => {
  switch (status) {
    case 'searching':
      return 20;
    case 'accepted':
    case 'on_the_way':
      return 40;
    case 'arrived':
    case 'verified':
      return 60;
    case 'inspection':
    case 'repair_started':
    case 'repair_completed':
    case 'waiting_approval':
      return 80;
    case 'completed':
      return 100;
    default:
      return 0;
  }
};

const getCardProgressLabel = (status) => {
  switch (status) {
    case 'searching':
      return 'Finding Captain';
    case 'accepted':
    case 'on_the_way':
      return 'Captain Assigned';
    case 'arrived':
    case 'verified':
      return 'Captain Arrived';
    case 'inspection':
    case 'repair_started':
    case 'repair_completed':
    case 'waiting_approval':
      return 'Repair In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Processing';
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings,    setBookings]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewDetails = (bookingId) => {
    navigate(`/customer/booking/${bookingId}`);
  };

  const handleDownloadReceipt = async (bookingId) => {
    try {
      const response = await api.get(`/api/billing/${bookingId}/download-receipt/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };


  useEffect(() => {
    if (location.state?.openBookingId) {
      navigate(`/customer/booking/${location.state.openBookingId}`);
      // Clear navigation state to prevent re-opening on back navigate/refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  // Location state
  const [locationLabel,   setLocationLabel]   = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDenied,  setLocationDenied]  = useState(false);
  const [changeOpen,      setChangeOpen]      = useState(false);
  const [manualCity,      setManualCity]      = useState('');

  // ─── Data fetch ─────────────────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      const [catsRes, bookingsRes] = await Promise.all([
        api.get('/api/services/categories/'),
        api.get('/api/bookings/my-bookings/')
      ]);
      setCategories(catsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // ─── Location: init from localStorage or profile ─────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('workizo_location');
    if (stored) {
      setLocationLabel(stored);
    } else if (user?.profile?.city) {
      setLocationLabel(`${user.profile.city}, Gujarat`);
    } else {
      detectLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Geolocation + Reverse Geocode (Nominatim) ───────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationLabel('Location unavailable');
      return;
    }
    setLocationLoading(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const city  = data.address?.city || data.address?.town || data.address?.village || 'Unknown City';
          const state = data.address?.state || '';
          const label = state ? `${city}, ${state}` : city;
          setLocationLabel(label);
          localStorage.setItem('workizo_location', label);
        } catch {
          setLocationLabel('Location detected');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
        const fallback = user?.profile?.city ? `${user.profile.city}, Gujarat` : 'Ahmedabad, Gujarat';
        setLocationLabel(fallback);
      },
      { timeout: 8000 }
    );
  };

  const saveManualLocation = () => {
    if (!manualCity) return;
    const label = `${manualCity}, India`;
    setLocationLabel(label);
    localStorage.setItem('workizo_location', label);
    setLocationDenied(false);
    setChangeOpen(false);
  };

  // ─── Derived data ────────────────────────────────────────────────────────
  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const pastBookings   = bookings.filter(b =>  ['completed', 'cancelled'].includes(b.status));
  
  const ALLOWED_CATEGORIES = ['Electrician', 'Plumber', 'Carpenter', 'AC Technician', 'Mechanic', 'Home Cleaning'];
  const displayCategories = categories
    .filter(c => ALLOWED_CATEGORIES.includes(c.name))
    .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Dashboard' }]}
      title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'there'} 👋`}
      description="What service do you need today?"
      loading={loading}
      actions={
        <Button
          variant="contained"
          onClick={() => navigate('/customer/book')}
          sx={{
            bgcolor: tokens.colors.primary,
            color: '#ffffff',
            px: 3,
            py: 1,
            borderRadius: `${tokens.borderRadiusSm}px`,
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': { bgcolor: '#23232F' }
          }}
        >
          Book a Partner
        </Button>
      }
    >
      <DashboardGrid sx={{ gap: `${tokens.sectionGap}px` }}>

        {/* ── 1. LOCATION CARD ─────────────────────────────────────────── */}
        <Box sx={span.full}>
          <Paper
            elevation={0}
            sx={{
              p: `${tokens.cardPadding}px`,
              border: `1px solid ${tokens.borderColor}`,
              borderRadius: `${tokens.borderRadius}px`,
              bgcolor: tokens.colors.paper,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              gap: 3,
              position: 'relative',
              overflow: 'hidden',
              transition: tokens.transition,
              '&:hover': {
                borderColor: 'rgba(26, 115, 232, 0.3)',
                boxShadow: tokens.shadowHover,
              }
            }}
          >
            {/* Left accent stripe */}
            <Box sx={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
              background: 'linear-gradient(180deg, #1A73E8 0%, #0F0F14 100%)',
              borderRadius: '12px 0 0 12px'
            }} />

            {/* Location info and Text */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0, flex: 1 }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%',
                bgcolor: 'rgba(26,115,232,0.06)',
                border: '1px solid rgba(26,115,232,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {locationLoading
                  ? <CircularProgress size={22} sx={{ color: '#1A73E8' }} />
                  : <RoomIcon sx={{ color: '#1A73E8', fontSize: 26 }} />
                }
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  📍 Current Location
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', mt: 0.5, color: tokens.colors.primary, lineHeight: 1.2 }} noWrap>
                  {locationLoading ? 'Detecting location…' : (locationLabel || 'Select location')}
                </Typography>
                {locationDenied && (
                  <Typography variant="caption" color="error.main" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                    Location permission denied. Please select manually.
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexShrink: 0 }}>
              <Button
                variant="contained"
                startIcon={<GpsFixedIcon />}
                onClick={detectLocation}
                disabled={locationLoading}
                sx={{
                  bgcolor: 'rgba(26, 115, 232, 0.08)',
                  color: '#1A73E8',
                  boxShadow: 'none',
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  '&:hover': { bgcolor: 'rgba(26, 115, 232, 0.15)', boxShadow: 'none' }
                }}
              >
                Detect Current Location
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditLocationAltIcon />}
                onClick={() => setChangeOpen(true)}
                sx={{
                  borderColor: tokens.borderColor,
                  color: tokens.colors.primary,
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  '&:hover': { borderColor: tokens.colors.primary, bgcolor: tokens.colors.bg }
                }}
              >
                Change Location
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* ── 2. SEARCH BAR ────────────────────────────────────────────── */}
        <Box sx={span.full}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex', alignItems: 'center', gap: 2,
              px: `${tokens.cardPadding}px`,
              py: 2,
              border: `1.5px solid ${tokens.borderColor}`,
              borderRadius: `${tokens.borderRadius}px`,
              bgcolor: tokens.colors.paper,
              transition: tokens.transition,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
              '&:focus-within': {
                borderColor: '#1A73E8',
                boxShadow: '0 0 0 4px rgba(26,115,232,0.08)'
              }
            }}
          >
            <SearchIcon sx={{ color: tokens.colors.textSecondary, fontSize: 24, flexShrink: 0 }} />
            <InputBase
              fullWidth
              placeholder="Search for a service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif', '& input': { padding: 0 } }}
            />
            {searchQuery && (
              <Button
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ minWidth: 0, p: 0.5, color: tokens.colors.textSecondary, borderRadius: '50%' }}
              >
                ✕
              </Button>
            )}
          </Paper>
        </Box>

        {/* ── 3. SERVICE CATEGORIES ────────────────────────────────────── */}
        <Box sx={span.full}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary }}>
              Services
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Select a category to book a certified professional
            </Typography>
          </Box>

          {displayCategories.length === 0 && searchQuery ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No services match &quot;<strong>{searchQuery}</strong>&quot;. Try &quot;AC&quot;, &quot;plumber&quot;, etc.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(6, 1fr)',
                },
                gap: `${tokens.cardGap}px`,
                width: '100%',
              }}
            >
              {displayCategories.map((cat) => {
                const styles = CATEGORY_STYLES[cat.name] || {
                  icon: <HandymanIcon sx={{ fontSize: 28, color: '#6B7280' }} />,
                  bgColor: '#F4F6F9',
                  borderColor: '#E5E7EB'
                };
                return (
                  <Box
                    key={cat.id}
                    onClick={() => navigate(`/customer/book?category=${cat.id}`)}
                    sx={{
                      p: `${tokens.cardPadding}px`,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: `${tokens.borderRadius}px`,
                      border: `1px solid ${tokens.borderColor}`,
                      bgcolor: tokens.colors.paper,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      height: '100%',
                      transition: tokens.transition,
                      userSelect: 'none',
                      '&:hover': {
                        borderColor: styles.borderColor,
                        transform: 'translateY(-4px)',
                        boxShadow: tokens.shadowHover,
                      },
                      '&:active': { transform: 'translateY(0px)' }
                    }}
                  >
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%',
                      bgcolor: styles.bgColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {styles.icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: tokens.colors.primary, lineHeight: 1.2 }}>
                      {cat.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ── 4. ACTIVE BOOKINGS ───────────────────────────────────────── */}
        {activeBookings.length > 0 && (
          <Box sx={span.full}>
            <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary }}>
                  Active Bookings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Live tracking for your ongoing service requests
                </Typography>
              </Box>
              <Chip
                label={`${activeBookings.length} active`}
                size="small"
                sx={{
                  bgcolor: 'rgba(26,115,232,0.08)',
                  color: '#1A73E8',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(26,115,232,0.15)',
                  px: 1
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: activeBookings.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
                },
                gap: `${tokens.cardGap}px`,
                width: '100%',
              }}
            >
              {activeBookings.map((bk) => {
                const catStyle = CATEGORY_STYLES[bk.service_category_detail?.name];
                
                // Calculate expected arrival text
                let arrivalText = "";
                if (bk.status === 'searching') {
                  arrivalText = "Finding nearest Captain...";
                } else if (['accepted', 'on_the_way'].includes(bk.status)) {
                  arrivalText = "Captain arriving in ~15 mins";
                } else {
                  arrivalText = "Captain arrived at premises";
                }

                return (
                  <Paper
                    key={bk.id}
                    elevation={0}
                    sx={{
                      p: `${tokens.cardPadding}px`,
                      border: `1px solid ${tokens.borderColor}`,
                      borderRadius: `${tokens.borderRadius}px`,
                      bgcolor: tokens.colors.paper,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 2.5,
                      height: '100%',
                      transition: tokens.transition,
                      '&:hover': {
                        borderColor: '#1A73E8',
                        boxShadow: tokens.shadowHover
                      }
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: '10px',
                          bgcolor: catStyle?.bgColor || '#F4F6F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {catStyle?.icon || <HandymanIcon sx={{ fontSize: 22, color: '#6B7280' }} />}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: tokens.colors.primary }}>
                            {bk.service_category_detail?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            #{bk.tracking_id || bk.id}
                          </Typography>
                        </Box>
                      </Box>
                      <StatusBadge status={bk.status} />
                    </Box>

                    <Divider sx={{ borderColor: tokens.borderColor }} />

                    {/* Booking Details Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Assigned Captain
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, color: tokens.colors.primary }}>
                          {bk.worker ? bk.worker.full_name : 'Finding Captain...'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ETA / Schedule
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, color: bk.status !== 'searching' ? 'primary.main' : 'text.primary' }}>
                          {arrivalText}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: tokens.borderColor }} />

                    {/* Progress Timeline bar */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Progress Timeline
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: tokens.colors.accent }}>
                          {getCardProgressLabel(bk.status)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={getCardTimelineProgress(bk.status)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#1A73E8',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>

                    {/* CTA */}
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handleViewDetails(bk.id)}
                      sx={{
                        bgcolor: tokens.colors.primary,
                        color: '#ffffff',
                        borderRadius: `${tokens.borderRadiusSm}px`,
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.2,
                        '&:hover': { bgcolor: '#23232F' }
                      }}
                    >
                      View Details
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── 5. BOOKING HISTORY ───────────────────────────────────────── */}
        <Box sx={span.full}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary }}>
              Booking History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your past service requests
            </Typography>
          </Box>

          {pastBookings.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6, textAlign: 'center',
                border: `1px dashed ${tokens.borderColor}`,
                borderRadius: `${tokens.borderRadius}px`,
                bgcolor: tokens.colors.bg
              }}
            >
              <HandymanIcon sx={{ fontSize: 48, color: tokens.colors.textMuted, mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                No completed bookings yet. Book your first service above!
              </Typography>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${tokens.borderColor}`,
                borderRadius: `${tokens.borderRadius}px`,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
              }}
            >
              <List disablePadding>
                {pastBookings.slice(0, 8).map((bk, idx, arr) => {
                  const catStyle = CATEGORY_STYLES[bk.service_category_detail?.name];
                  return (
                    <React.Fragment key={bk.id}>
                      <ListItem
                        sx={{
                          px: `${tokens.cardPadding}px`,
                          py: 2,
                          cursor: 'pointer',
                          transition: tokens.transition,
                          '&:hover': { bgcolor: tokens.colors.bg }
                        }}
                        onClick={() => handleViewDetails(bk.id)}
                      >
                        <Box sx={{
                          width: 40, height: 40, borderRadius: '8px', mr: 2, flexShrink: 0,
                          bgcolor: catStyle?.bgColor || '#F4F6F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {catStyle?.icon
                            ? React.cloneElement(catStyle.icon, { sx: { fontSize: 20, color: catStyle.icon.props.sx.color } })
                            : <HandymanIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                          }
                        </Box>
                        <ListItemText
                          primary={bk.service_category_detail?.name}
                          secondary={`${new Date(bk.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}  ·  #${bk.tracking_id || bk.id}`}
                          primaryTypographyProps={{ fontWeight: 700, variant: 'body2', color: tokens.colors.primary }}
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                        <StatusBadge status={bk.status} />
                      </ListItem>
                      {idx < arr.length - 1 && (
                        <Divider sx={{ borderColor: tokens.borderColor }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>

        {/* ── 5B. PAYMENT & BILLING HISTORY ─────────────────────────────── */}
        <Box sx={span.full}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', color: tokens.colors.primary }}>
              Payment & Billing History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Receipts and details of all your service transactions
            </Typography>
          </Box>

          {bookings.filter(b => b.payment).length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6, textAlign: 'center',
                border: `1px dashed ${tokens.borderColor}`,
                borderRadius: `${tokens.borderRadius}px`,
                bgcolor: tokens.colors.bg
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                No transaction logs or receipts registered yet.
              </Typography>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${tokens.borderColor}`,
                borderRadius: `${tokens.borderRadius}px`,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)'
              }}
            >
              <TableContainer sx={{ border: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Receipt No</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Booking ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Payment Method</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary }}>Payment Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: tokens.colors.primary, textAlign: 'right' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookings.filter(b => b.payment).map((bk) => {
                      const p = bk.payment;
                      return (
                        <TableRow key={bk.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{p.receipt_number || 'N/A'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>#{bk.tracking_id || bk.id}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>₹{p.amount}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{p.method.toUpperCase()}</TableCell>
                          <TableCell>
                            <Chip
                              label={p.status.toUpperCase()}
                              size="small"
                              color={p.status === 'PAID' || p.status === 'success' ? 'success' : p.status === 'FAILED' ? 'error' : 'warning'}
                              sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>
                            {new Date(p.payment_time || p.created_at).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            {p.status === 'PAID' || p.status === 'success' ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadReceipt(bk.id)}
                                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, py: 0.5 }}
                              >
                                Receipt
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleViewDetails(bk.id)}
                                sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: '6px', textTransform: 'none', fontWeight: 700, py: 0.5 }}
                              >
                                View / Pay
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>


        {/* ── 6. ACCOUNT + SUPPORT ─────────────────────────────────────── */}
        <Box sx={span.half}>
          <DashboardCard title="Account Management" subtitle="Update your profile, contact info, and security settings">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Modify your stored address details, contact credentials, or security keys to personalize your service experience.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/customer/profile')}
                sx={{
                  borderColor: '#000000',
                  color: '#000000',
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  alignSelf: 'flex-start',
                  '&:hover': { borderColor: '#23232F', bgcolor: 'rgba(0,0,0,0.03)' }
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </DashboardCard>
        </Box>

        <Box sx={span.half}>
          <DashboardCard title="Need Assistance?" subtitle="Raise issues, contact settlement, or get general help">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Have questions about billing, partner ratings, or scheduled visits? Contact our 24/7 dedicated support team.
              </Typography>
              <Button
                variant="outlined"
                disabled
                sx={{
                  borderColor: tokens.borderColor,
                  color: 'text.secondary',
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  alignSelf: 'flex-start'
                }}
              >
                Contact Support
              </Button>
            </Box>
          </DashboardCard>
        </Box>

      </DashboardGrid>

      {/* ── Location Change Dialog ──────────────────────────────────────── */}
      <Dialog
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
        PaperProps={{ sx: { borderRadius: `${tokens.borderRadius}px`, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
          📍 Change Location
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select your city to find service professionals near you.
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              displayEmpty
              sx={{ borderRadius: `${tokens.borderRadiusSm}px` }}
            >
              <MenuItem value="" disabled>Select a city</MenuItem>
              {CITIES.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setChangeOpen(false)}
            sx={{ textTransform: 'none', color: tokens.colors.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveManualLocation}
            disabled={!manualCity}
            sx={{
              bgcolor: tokens.colors.primary, color: '#ffffff',
              borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700,
              '&:hover': { bgcolor: '#23232F' }
            }}
          >
            Save Location
          </Button>
        </DialogActions>
      </Dialog>



    </DashboardPage>
  );
}

export default CustomerDashboard;
