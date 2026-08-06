import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { buildWsUrl, buildMediaUrl } from '../services/api';
import {
  Container, Typography, Box, Grid, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  CircularProgress, Alert, TextField, MenuItem, Select, FormControl,
  InputLabel, Card, CardContent, InputAdornment, Switch, Divider,
  Avatar, LinearProgress, Tab, Tabs, Stack
} from '@mui/material';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HandymanIcon from '@mui/icons-material/Handyman';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StarIcon from '@mui/icons-material/Star';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CheckIcon from '@mui/icons-material/Check';

import toast from 'react-hot-toast';
import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid, EmptyState 
} from '../components/dashboard';

const COLORS = ['#1A73E8', '#34A853', '#FBBC05', '#EA4335', '#8F00FF', '#00C9FF'];

const AdminDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'dashboard';

  const getTabDetails = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Platform Overview',
          description: 'Real-time analytics and platform performance metrics.'
        };
      case 'bookings':
        return {
          title: 'Booking Management',
          description: 'Inspect timelines, view bills, cancel bookings, or reassign service professionals.'
        };
      case 'workers':
        return {
          title: 'Captain Directory',
          description: 'Onboard new captains, review government documents, verify KYC details, or suspend credentials.'
        };
      case 'customers':
        return {
          title: 'Customer Registry',
          description: 'Inspect user profile stats, service addresses, and historic order logs.'
        };
      case 'categories':
        return {
          title: 'Service Categories',
          description: 'Manage supported repair skills, edit flat labor rates, and configure active categories.'
        };
      case 'payments':
        return {
          title: 'Payout Requests',
          description: 'Process settlement payouts and verify transactions.'
        };
      case 'bills':
        return {
          title: 'Billing Records',
          description: 'View and download compiled PDF invoices.'
        };
      case 'reviews':
        return {
          title: 'Customer Feedback',
          description: 'Monitor review history, ratings, and customer opinions.'
        };
      case 'reports':
        return {
          title: 'Advanced Reports',
          description: 'Analyze long-term revenue growth and category performance.'
        };
      case 'notifications':
        return {
          title: 'Announcements Panel',
          description: 'Send notifications and broadcasts to users.'
        };
      case 'settings':
        return {
          title: 'System Settings',
          description: 'Configure parameters and variables.'
        };
      case 'profile':
        return {
          title: 'My Settings',
          description: 'Manage admin credentials.'
        };
      default:
        return {
          title: 'Admin Dashboard',
          description: 'Manage your application.'
        };
    }
  };

  const { title, description } = getTabDetails();

  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: activeTab.toUpperCase() }]}
      title={title}
      description={description}
    >
      {activeTab === 'dashboard' && <DashboardView hideHeader />}
      {activeTab === 'bookings' && <BookingsView hideHeader />}
      {activeTab === 'workers' && <WorkersView hideHeader />}
      {activeTab === 'customers' && <CustomersView hideHeader />}
      {activeTab === 'categories' && <CategoriesView hideHeader />}
      {activeTab === 'payments' && <PaymentsView hideHeader />}
      {activeTab === 'bills' && <BillsView hideHeader />}
      {activeTab === 'reviews' && <ReviewsView hideHeader />}
      {activeTab === 'reports' && <ReportsView hideHeader />}
      {activeTab === 'notifications' && <NotificationsView hideHeader />}
      {activeTab === 'settings' && <SettingsView hideHeader />}
      {activeTab === 'profile' && <ProfileView hideHeader />}
    </DashboardPage>
  );
};

// ----------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------
const DashboardView = ({ hideHeader }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('accounts/admin/dashboard/stats/');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress color="primary" />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Loading dashboard intelligence...
        </Typography>
      </Box>
    );
  }

  const cards = data?.cards || {};
  const charts = data?.charts || {};
  const activities = data?.activities || [];

  const cardList = [
    { title: 'Total Customers', val: cards.totalCustomers ?? 0, icon: <PeopleIcon />, color: '#1A73E8' },
    { title: 'Total Captains', val: cards.totalCaptains ?? 0, icon: <SupervisorAccountIcon />, color: '#34A853' },
    { title: 'Online Captains', val: cards.onlineCaptains ?? 0, icon: <CheckCircleIcon />, color: '#34A853' },
    { title: 'Pending Captains', val: cards.pendingApprovals ?? 0, icon: <SupervisorAccountIcon />, color: '#FBBC05' },
    { title: 'Total Bookings', val: cards.totalBookings ?? 0, icon: <ReceiptLongIcon />, color: '#1A73E8' },
    { title: 'Active Bookings', val: cards.activeBookings ?? 0, icon: <ReceiptLongIcon />, color: '#FBBC05' },
    { title: 'Today\'s Revenue', val: `₹${(cards.todayRevenue || 0).toFixed(2)}`, icon: <PaymentIcon />, color: '#34A853' },
    { title: 'Monthly Revenue', val: `₹${(cards.monthlyRevenue || 0).toFixed(2)}`, icon: <PaymentIcon />, color: '#1A73E8' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${tokens.sectionGap}px` }}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time analytics and platform performance metrics.
          </Typography>
        </Box>
      )}

      {/* Metric Cards Grid */}
      <SummaryGrid columns={4}>
        {cardList.map((card, idx) => (
          <SummaryCard
            key={idx}
            label={card.title}
            value={card.val}
            icon={card.icon}
            accentColor={card.color}
            loading={loading}
          />
        ))}
      </SummaryGrid>

      {/* Charts & Analytics Grid */}
      <DashboardGrid>
        {/* Daily Bookings Chart */}
        <Box sx={span.twoThirds}>
          <DashboardCard
            title="Daily Bookings (Last 30 Days)"
          >
            <Box sx={{ width: '100%', height: 300, minHeight: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.dailyBookings || []}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="bookings" stroke="#1A73E8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBookings)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </DashboardCard>
        </Box>

        {/* Category Share Distribution */}
        <Box sx={span.oneThird}>
          <DashboardCard
            title="Service Category Share"
            sx={{ height: '100%' }}
          >
            <Box sx={{ width: '100%', height: 280, minHeight: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.categoryDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {(charts.categoryDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} layout="vertical" align="center" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </DashboardCard>
        </Box>

        {/* Monthly Revenue Chart */}
        <Box sx={span.half}>
          <DashboardCard
            title="Monthly Revenue Performance"
          >
            <Box sx={{ width: '100%', height: 280, minHeight: 280, mt: 2 }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Bar dataKey="revenue" fill="#1A73E8" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </DashboardCard>
        </Box>

        {/* Recent Activities */}
        <Box sx={span.half}>
          <DashboardCard
            title="Recent Platform Activities"
            sx={{ height: '100%' }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
              {activities && activities.map((act, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{
                    bgcolor: act.type.includes('payment') ? 'rgba(52, 168, 83, 0.08)' : 'rgba(26, 115, 232, 0.08)',
                    color: act.type.includes('payment') ? '#34A853' : '#1A73E8',
                    width: 40, height: 40,
                    border: act.type.includes('payment') ? '1px solid rgba(52, 168, 83, 0.15)' : '1px solid rgba(26, 115, 232, 0.15)'
                  }}>
                    {act.type.includes('payment') ? <PaymentIcon sx={{ fontSize: 20 }} /> : <HandymanIcon sx={{ fontSize: 20 }} />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="700" noWrap>{act.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>{act.description}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                    {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))}
              {(!activities || activities.length === 0) && (
                <EmptyState
                  title="No recent activities"
                  description="No platform actions or events have occurred recently."
                />
              )}
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </Box>
  );
};

// ----------------------------------------------------
// 2. BOOKINGS VIEW
// ----------------------------------------------------
const BookingsView = ({ hideHeader }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Detail view state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  
  // Reassign state
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [captains, setCaptains] = useState([]);
  const [selectedCaptain, setSelectedCaptain] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('accounts/admin/bookings/', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined
        }
      });
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const catRes = await api.get('accounts/admin/categories/');
        setCategories(catRes.data);
        const captRes = await api.get('accounts/admin/workers/');
        setCaptains(captRes.data.filter(c => c.profile?.approval_status === 'approved'));
      } catch (err) {
        console.error(err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [statusFilter, categoryFilter]);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      fetchBookings();
    }
  };

  const handleOpenDetails = async (bookingId) => {
    try {
      const res = await api.get(`accounts/admin/bookings/${bookingId}/`);
      setSelectedBooking(res.data);
      setOpenDetailDialog(true);
    } catch (err) {
      toast.error('Failed to load booking details.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await api.post(`accounts/admin/bookings/${bookingId}/`, { action: 'cancel' });
        toast.success('Booking cancelled.');
        fetchBookings();
        setOpenDetailDialog(false);
      } catch (err) {
        toast.error('Failed to cancel booking.');
      }
    }
  };

  const handleOpenAssign = (booking) => {
    setSelectedBooking(booking);
    setSelectedCaptain('');
    setOpenAssignDialog(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCaptain) return;
    try {
      await api.post(`accounts/admin/bookings/${selectedBooking.id}/`, {
        action: 'assign',
        worker_id: selectedCaptain
      });
      toast.success('Captain assigned successfully.');
      setOpenAssignDialog(false);
      fetchBookings();
      if (openDetailDialog) {
        handleOpenDetails(selectedBooking.id);
      }
    } catch (err) {
      toast.error('Failed to assign captain.');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'searching': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Booking Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect timelines, view bills, cancel bookings, or reassign service professionals.
          </Typography>
        </Box>
      )}

      {/* Filters & Search Header */}
      <DashboardCard>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by ID, Tracking ID, Customer or Captain... (Press Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Service Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Service Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Booking Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Booking Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="searching">Searching</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchBookings}
              startIcon={<FilterListIcon />}
              sx={{
                bgcolor: tokens.colors.primary,
                color: '#ffffff',
                borderRadius: `${tokens.borderRadiusSm}px`,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#222222' }
              }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </DashboardCard>

      {/* Bookings Table */}
      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Bookings Registry" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Booking ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Captain</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Service Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'Outfit' }}>{b.tracking_id || `#${b.id}`}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.customer?.full_name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.worker?.full_name || <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>Not Assigned</Typography>}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{b.service_category_detail?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={b.status.replace('_', ' ').toUpperCase()}
                        color={getStatusChipColor(b.status)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: tokens.colors.textSecondary, fontWeight: 500 }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <IconButton color="primary" onClick={() => handleOpenDetails(b.id)} size="small">
                          <VisibilityIcon />
                        </IconButton>
                        {!['completed', 'cancelled'].includes(b.status) && (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleOpenAssign(b)}
                            sx={{
                              borderColor: tokens.colors.primary,
                              color: tokens.colors.primary,
                              fontWeight: 700,
                              borderRadius: `${tokens.borderRadiusSm}px`,
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: tokens.colors.primary,
                                bgcolor: 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<ReceiptLongIcon />}
                        title="No bookings found"
                        description="There are no system bookings matching your search/filters."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}

      {/* Detail Dialog */}
      {selectedBooking && (
        <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Detailed Log — {selectedBooking.tracking_id || `#${selectedBooking.id}`}</Typography>
            <IconButton onClick={() => setOpenDetailDialog(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: tokens.borderColor }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase>Customer Information</Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>{selectedBooking.customer?.full_name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedBooking.customer?.email}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedBooking.customer?.phone}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>{selectedBooking.address}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase>Captain Details</Typography>
                {selectedBooking.worker ? (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body1" fontWeight="bold">{selectedBooking.worker.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedBooking.worker.email}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedBooking.worker.phone}</Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleOpenAssign(selectedBooking)}
                      sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
                    >
                      Reassign Professional
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Alert severity="warning">No captain assigned yet.</Alert>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenAssign(selectedBooking)}
                      sx={{
                        mt: 1.5,
                        bgcolor: tokens.colors.accent,
                        color: '#ffffff',
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#155cb0' }
                      }}
                    >
                      Assign Professional
                    </Button>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Work Details</Typography>
                <Typography variant="body2"><strong>Problem Category:</strong> {selectedBooking.service_category_detail?.name}</Typography>
                <Typography variant="body2"><strong>Job Type:</strong> {selectedBooking.problem_type}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Description:</strong> {selectedBooking.problem_description}</Typography>
              </Grid>

              {/* Photos Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Uploaded Visual Media</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">Before Photo</Typography>
                    {selectedBooking.before_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedBooking.before_photo)} sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }} />
                    ) : <Typography variant="caption" color="text.disabled">None</Typography>}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">After Photo</Typography>
                    {selectedBooking.after_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedBooking.after_photo)} sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }} />
                    ) : <Typography variant="caption" color="text.disabled">None</Typography>}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">Spare Part Invoice Copy</Typography>
                    {selectedBooking.spare_part_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedBooking.spare_part_photo)} sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }} />
                    ) : <Typography variant="caption" color="text.disabled">None</Typography>}
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700">Offsite Invoice Copy</Typography>
                    {selectedBooking.invoice_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedBooking.invoice_photo)} sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }} />
                    ) : <Typography variant="caption" color="text.disabled">None</Typography>}
                  </Grid>
                </Grid>
              </Grid>

              {/* Bill Details */}
              {selectedBooking.bill && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Invoice Calculation</Typography>
                  <Box sx={{ p: 2, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">Base Labour Charge:</Typography>
                      <Typography variant="body2" fontWeight="bold">₹{selectedBooking.bill.labour_charges}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">Spare Parts Charges:</Typography>
                      <Typography variant="body2" fontWeight="bold">₹{selectedBooking.bill.parts_charges}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">GST (18%):</Typography>
                      <Typography variant="body2" fontWeight="bold">₹{selectedBooking.bill.gst}</Typography>
                    </Box>
                    <Divider sx={{ my: 1, borderColor: tokens.borderColor }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle2" fontWeight="700">Grand Total:</Typography>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">₹{selectedBooking.bill.grand_total}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            {!['completed', 'cancelled'].includes(selectedBooking.status) && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => handleCancelBooking(selectedBooking.id)}
                sx={{ borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
              >
                Cancel Booking
              </Button>
            )}
            <Button
              onClick={() => setOpenDetailDialog(false)}
              color="primary"
              sx={{ fontWeight: 700 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Assign Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Professional</DialogTitle>
        <DialogContent sx={{ minWidth: 320, pt: 1 }}>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Available Captains</InputLabel>
            <Select
              value={selectedCaptain}
              onChange={(e) => setSelectedCaptain(e.target.value)}
              label="Available Captains"
            >
              {captains.map((c) => (
                <MenuItem key={c.user.id} value={c.user.id}>
                  {c.user.full_name} ({c.profile?.service_category?.name || 'Unassigned'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAssign}
            variant="contained"
            disabled={!selectedCaptain}
            sx={{
              bgcolor: tokens.colors.accent,
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#155cb0' }
            }}
          >
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ----------------------------------------------------
// 3. WORKERS (CAPTAIN) VIEW
// ----------------------------------------------------
const WorkersView = ({ hideHeader }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [openKYCDialog, setOpenKYCDialog] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('accounts/admin/workers/');
      setWorkers(res.data);
    } catch (err) {
      toast.error('Failed to load workers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleVerify = async (userId, approvalStatus) => {
    try {
      await api.post(`accounts/admin/workers/${userId}/verify/`, { approval_status: approvalStatus });
      toast.success(`Worker status set to ${approvalStatus}.`);
      fetchWorkers();
      setOpenKYCDialog(false);
    } catch (err) {
      toast.error('Failed to update worker state.');
    }
  };

  const handleToggleState = async (userId) => {
    try {
      await api.post(`accounts/admin/users/${userId}/toggle-active/`);
      toast.success('Active state toggled.');
      fetchWorkers();
    } catch (err) {
      toast.error('Failed to toggle worker active state.');
    }
  };

  const handleViewKYC = async (workerId) => {
    try {
      const res = await api.get(`accounts/admin/workers/${workerId}/`);
      setSelectedWorker(res.data);
      setOpenKYCDialog(true);
    } catch (err) {
      toast.error('Failed to load detailed worker KYC.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Worker (Captain) Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approve registrations, check KYC documents, suspend accounts, and view wallets.
          </Typography>
        </Box>
      )}

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Captain Directory" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Captain</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Experience</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Online Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Registration Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workers.map((w) => (
                  <TableRow key={w.user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar src={buildMediaUrl(w.profile?.profile_photo)} />
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'Outfit' }}>{w.user.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{w.user.email} | {w.user.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{w.profile?.service_category?.name || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{w.profile?.experience} Years</TableCell>
                    <TableCell>
                      {w.profile?.online_status ? (
                        <Chip label="ONLINE" color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="OFFLINE" color="default" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={w.profile?.approval_status?.toUpperCase() || 'PENDING'}
                        color={w.profile?.approval_status === 'approved' ? 'success' : w.profile?.approval_status === 'rejected' ? 'error' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ color: '#FBBC05', fontSize: 18 }} />
                        <Typography variant="body2" fontWeight="700">{w.rating || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewKYC(w.user.id)}
                          sx={{
                            borderColor: tokens.borderColor,
                            color: tokens.colors.primary,
                            fontWeight: 700,
                            borderRadius: `${tokens.borderRadiusSm}px`,
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: tokens.colors.primary,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          KYC & Wallet
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color={w.user.is_active ? 'warning' : 'success'}
                          onClick={() => handleToggleState(w.user.id)}
                          sx={{
                            borderRadius: `${tokens.borderRadiusSm}px`,
                            textTransform: 'none',
                            fontWeight: 700
                          }}
                        >
                          {w.user.is_active ? 'Suspend' : 'Activate'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {workers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<SupervisorAccountIcon />}
                        title="No Captains Registered"
                        description="There are no registered worker or captain accounts on file."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}

      {/* KYC & Wallet Dialog */}
      {selectedWorker && (
        <Dialog open={openKYCDialog} onClose={() => setOpenKYCDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Detailed Portfolio — {selectedWorker.user?.full_name}</Typography>
            <IconButton onClick={() => setOpenKYCDialog(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: tokens.borderColor }}>
            <Grid container spacing={3}>
              {/* Personal */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Contact Info</Typography>
                <Typography variant="body2"><strong>Email:</strong> {selectedWorker.user?.email}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {selectedWorker.user?.phone}</Typography>
                <Typography variant="body2"><strong>Address:</strong> {selectedWorker.profile?.address}, {selectedWorker.profile?.city}, {selectedWorker.profile?.state}</Typography>
              </Grid>
              {/* Finance */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Bank Details</Typography>
                <Typography variant="body2"><strong>Bank Account:</strong> {selectedWorker.profile?.bank_account || 'N/A'}</Typography>
                <Typography variant="body2"><strong>IFSC Code:</strong> {selectedWorker.profile?.ifsc_code || 'N/A'}</Typography>
                <Typography variant="body2"><strong>PAN Number:</strong> {selectedWorker.profile?.pan_number || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Aadhaar Number:</strong> {selectedWorker.profile?.aadhaar_number || 'N/A'}</Typography>
              </Grid>

              {/* KYC images */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom sx={{ mt: 1 }}>KYC Identity Cards</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700" gutterBottom>Aadhaar Photo</Typography>
                    {selectedWorker.profile?.aadhaar_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedWorker.profile.aadhaar_photo)} sx={{ width: '100%', height: 200, objectFit: 'contain', border: `1px solid ${tokens.borderColor}`, borderRadius: `${tokens.borderRadiusSm}px` }} />
                    ) : <Alert severity="warning">No Aadhaar copy uploaded</Alert>}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700" gutterBottom>PAN Photo</Typography>
                    {selectedWorker.profile?.pan_photo ? (
                      <Box component="img" src={buildMediaUrl(selectedWorker.profile.pan_photo)} sx={{ width: '100%', height: 200, objectFit: 'contain', border: `1px solid ${tokens.borderColor}`, borderRadius: `${tokens.borderRadiusSm}px` }} />
                    ) : <Alert severity="warning">No PAN copy uploaded</Alert>}
                  </Grid>
                </Grid>
              </Grid>

              {/* Wallet Ledger */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom sx={{ mt: 1 }}>Wallet Balance Details</Typography>
                {selectedWorker.wallet ? (
                  <Box>
                    <Box display="flex" gap={3} mb={3}>
                      <Box sx={{ p: 2, flex: 1, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="700" uppercase>Current Balance</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>₹{selectedWorker.wallet.current_balance}</Typography>
                      </Box>
                      <Box sx={{ p: 2, flex: 1, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px`, border: `1px solid ${tokens.borderColor}` }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="700" uppercase>Pending Balance</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>₹{selectedWorker.wallet.pending_balance}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="700" uppercase gutterBottom>Transactions Log</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: `${tokens.borderRadiusSm}px`, borderColor: tokens.borderColor }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedWorker.wallet.transactions && selectedWorker.wallet.transactions.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell>{t.description}</TableCell>
                              <TableCell>
                                <Chip label={t.transaction_type.toUpperCase()} size="small" color={t.transaction_type === 'credit' ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{t.amount}</TableCell>
                              <TableCell sx={{ color: tokens.colors.textSecondary }}>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                          {(!selectedWorker.wallet.transactions || selectedWorker.wallet.transactions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 3, color: tokens.colors.textSecondary }}>No wallet transactions logged.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Alert severity="info">Wallet ledger not initialized for this account.</Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            {selectedWorker.profile?.approval_status !== 'approved' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleVerify(selectedWorker.user.id, 'approved')}
                sx={{ borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
              >
                Approve Registration
              </Button>
            )}
            {selectedWorker.profile?.approval_status !== 'rejected' && (
              <Button
                variant="contained"
                color="error"
                onClick={() => handleVerify(selectedWorker.user.id, 'rejected')}
                sx={{ borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
              >
                Reject Registration
              </Button>
            )}
            <Button
              onClick={() => setOpenKYCDialog(false)}
              sx={{ fontWeight: 700 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 4. CUSTOMERS VIEW
// ----------------------------------------------------
const CustomersView = ({ hideHeader }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('accounts/admin/customers/');
      setCustomers(res.data);
    } catch (err) {
      toast.error('Failed to load customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleState = async (userId) => {
    try {
      await api.post(`accounts/admin/users/${userId}/toggle-active/`);
      toast.success('Customer active status toggled.');
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to update customer status.');
    }
  };

  const handleViewHistory = async (customerId) => {
    try {
      const res = await api.get(`accounts/admin/customers/${customerId}/`);
      setSelectedCustomer(res.data);
      setOpenHistoryDialog(true);
    } catch (err) {
      toast.error('Failed to retrieve customer detailed profile.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Customer Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track customer profiles, block user accounts, and audit complete service booking histories.
          </Typography>
        </Box>
      )}

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Customer Directory" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Mobile Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Location (City)</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Bookings Placed</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.user.id} hover>
                    <TableCell fontWeight="bold" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>{c.user.full_name}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.user.email}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.user.phone}</TableCell>
                    <TableCell sx={{ color: tokens.colors.textSecondary }}>{c.profile?.city || 'Not specified'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">{c.total_bookings}</TableCell>
                    <TableCell>
                      {c.user.is_active ? (
                        <Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="BLOCKED" color="error" size="small" sx={{ fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewHistory(c.user.id)}
                          sx={{
                            borderColor: tokens.borderColor,
                            color: tokens.colors.primary,
                            fontWeight: 700,
                            borderRadius: `${tokens.borderRadiusSm}px`,
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: tokens.colors.primary,
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          Audit logs
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color={c.user.is_active ? 'error' : 'success'}
                          onClick={() => handleToggleState(c.user.id)}
                          sx={{
                            borderRadius: `${tokens.borderRadiusSm}px`,
                            textTransform: 'none',
                            fontWeight: 700
                          }}
                        >
                          {c.user.is_active ? 'Block' : 'Activate'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<PeopleIcon />}
                        title="No Customers Found"
                        description="There are no registered customer accounts on file."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}

      {/* Customer Audit Dialog */}
      {selectedCustomer && (
        <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Customer Profile & History — {selectedCustomer.user?.full_name}</Typography>
            <IconButton onClick={() => setOpenHistoryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: tokens.borderColor }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Personal Information</Typography>
            <Typography variant="body2"><strong>Email:</strong> {selectedCustomer.user?.email}</Typography>
            <Typography variant="body2"><strong>Phone:</strong> {selectedCustomer.user?.phone}</Typography>
            <Typography variant="body2"><strong>Home Address:</strong> {selectedCustomer.profile?.address || 'N/A'}</Typography>
            <Typography variant="body2"><strong>City/State:</strong> {selectedCustomer.profile?.city}, {selectedCustomer.profile?.state}</Typography>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Bookings History</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: `${tokens.borderRadiusSm}px`, borderColor: tokens.borderColor }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                    <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCustomer.bookings && selectedCustomer.bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell fontWeight="bold">{b.tracking_id}</TableCell>
                      <TableCell>{b.service_category_detail?.name}</TableCell>
                      <TableCell>
                        <Chip label={b.status.toUpperCase()} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ color: tokens.colors.textSecondary }}>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!selectedCustomer.bookings || selectedCustomer.bookings.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: tokens.colors.textSecondary }}>No bookings on file.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight="700" uppercase gutterBottom>Payments log</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: `${tokens.borderRadiusSm}px`, borderColor: tokens.borderColor }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                    <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCustomer.payments && selectedCustomer.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.transaction_id || 'N/A'}</TableCell>
                      <TableCell fontWeight="bold">₹{p.amount}</TableCell>
                      <TableCell>{p.method.toUpperCase()}</TableCell>
                      <TableCell>
                        <Chip label={p.status.toUpperCase()} size="small" color={p.status === 'success' ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!selectedCustomer.payments || selectedCustomer.payments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3, color: tokens.colors.textSecondary }}>No payment transactions on file.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenHistoryDialog(false)} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 5. SERVICE CATEGORIES VIEW
// ----------------------------------------------------
const CategoriesView = ({ hideHeader }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Edit fields
  const [description, setDescription] = useState('');
  const [baseCharge, setBaseCharge] = useState(0.0);
  const [iconName, setIconName] = useState('');
  const [isCategoryActive, setIsCategoryActive] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await api.get('accounts/admin/categories/');
      setCategories(res.data);
    } catch (err) {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setDescription(category.description || '');
    setBaseCharge(category.base_labour_charge || 0.0);
    setIconName(category.icon || '');
    setIsCategoryActive(category.is_active);
    setOpenEditDialog(true);
  };

  const handleConfirmEdit = async () => {
    try {
      await api.put(`accounts/admin/categories/${selectedCategory.id}/`, {
        description,
        icon: iconName,
        base_labour_charge: baseCharge,
        is_active: isCategoryActive
      });
      toast.success('Service Category updated.');
      setOpenEditDialog(false);
      fetchCategories();
    } catch (err) {
      toast.error('Failed to update category.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Service Categories Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure baseline labour rates, toggle service availability, and descriptions for the core listings.
          </Typography>
        </Box>
      )}

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Categories Listing" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Category Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Display Icon</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Base Labour Fee</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell fontWeight="bold" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>{c.name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{c.icon || 'Not configured'}</TableCell>
                    <TableCell sx={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: tokens.colors.textSecondary }}>
                      {c.description || 'No description provided.'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{c.base_labour_charge}</TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Chip label="ENABLED" color="success" size="small" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="DISABLED" color="default" size="small" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenEdit(c)}
                        sx={{
                          borderColor: tokens.borderColor,
                          color: tokens.colors.primary,
                          fontWeight: 700,
                          borderRadius: `${tokens.borderRadiusSm}px`,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: tokens.colors.primary,
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        Configure
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}

      {/* Edit Category Dialog */}
      {selectedCategory && (
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Configure Service Category — {selectedCategory.name}</DialogTitle>
          <DialogContent sx={{ minWidth: 360, display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              label="Base Labour Charge (₹)"
              type="number"
              size="small"
              fullWidth
              value={baseCharge}
              onChange={(e) => setBaseCharge(parseFloat(e.target.value) || 0.0)}
            />
            <TextField
              label="Display Icon Name"
              size="small"
              fullWidth
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              helperText="E.g., ElectricalServices, Plumbing, Carpenter, AcUnit, Build, CleaningServices"
            />
            <TextField
              label="Category Description"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">Category Active Status:</Typography>
              <Switch
                checked={isCategoryActive}
                onChange={(e) => setIsCategoryActive(e.target.checked)}
                color="primary"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmEdit}
              variant="contained"
              sx={{
                bgcolor: tokens.colors.accent,
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#155cb0' }
              }}
            >
              Save Configuration
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 6. PAYMENTS VIEW
// ----------------------------------------------------
const PaymentsView = ({ hideHeader }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayments = async () => {
    try {
      const res = await api.get('accounts/admin/payments/', {
        params: { search: search || undefined }
      });
      setPayments(res.data);
    } catch (err) {
      toast.error('Failed to load payments ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // WebSocket real-time synchronization
    let isActive = true;
    let socket = null;
    let reconnectTimer = null;
    let pingInterval = null;

    const connect = () => {
      if (!isActive) return;
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const wsUrl = buildWsUrl('/ws/notifications/', `?token=${token}`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (!isActive) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'payment_update') {
            const updatedPayment = payload.payment;
            setPayments(prev => {
              const index = prev.findIndex(p => p.id === updatedPayment.id);
              if (index !== -1) {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  ...updatedPayment,
                  // fallback to old nested details if missing
                  customer_name: updatedPayment.customer_name || updated[index].customer_name,
                  worker_name: updatedPayment.worker_name || updated[index].worker_name,
                  tracking_id: updatedPayment.tracking_id || updated[index].tracking_id
                };
                return updated;
              } else {
                return [updatedPayment, ...prev];
              }
            });
            toast.success(`Payment updated: Receipt ${updatedPayment.receipt_number || 'N/A'}`);
          }
        } catch (err) {
          console.error('[WS] Payment update error:', err);
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = (event) => {
        if (pingInterval) clearInterval(pingInterval);
        if (event.code === 4003) {
          return;
        }
        if (isActive) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      clearTimeout(reconnectTimer);
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      fetchPayments();
    }
  };

  // Client-side filtering
  const filteredPayments = payments.filter((p) => {
    const matchesMethod = methodFilter === 'ALL' || (p.method && p.method.toUpperCase() === methodFilter);
    
    // Normalize status filters
    let normalizedStatus = p.status ? p.status.toUpperCase() : 'PENDING';
    if (normalizedStatus === 'SUCCESS') normalizedStatus = 'PAID';
    
    let targetStatus = statusFilter;
    if (targetStatus === 'SUCCESS') targetStatus = 'PAID';

    const matchesStatus = statusFilter === 'ALL' || normalizedStatus === targetStatus;
    return matchesMethod && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('No transaction records to export.');
      return;
    }
    const headers = ['Receipt Number', 'Booking ID', 'Customer', 'Captain', 'Amount', 'Payment Method', 'Payment Status', 'Payment Date', 'Transaction ID'];
    const rows = filteredPayments.map(p => [
      p.receipt_number || 'N/A',
      p.tracking_id || p.booking,
      p.customer_name || 'N/A',
      p.worker_name || 'N/A',
      `₹${p.amount}`,
      p.method ? p.method.toUpperCase() : 'N/A',
      p.status ? p.status.toUpperCase() : 'N/A',
      new Date(p.created_at).toLocaleDateString(),
      p.transaction_id || 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payments report exported successfully.');
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Payment Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track transaction details, payout methods, and audit payments success rates.
          </Typography>
        </Box>
      )}

      {/* Search & Filter Header */}
      <DashboardCard>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Transaction ID, Tracking ID... (Enter)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Method</InputLabel>
              <Select
                value={methodFilter}
                label="Method"
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Methods</MenuItem>
                <MenuItem value="ONLINE">Online Payment</MenuItem>
                <MenuItem value="CASH">Cash Payment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PAID">PAID</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="WAITING_FOR_CASH_CONFIRMATION">CASH PENDING</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} display="flex" gap={1.5}>
            <Button
              variant="contained"
              onClick={fetchPayments}
              sx={{
                bgcolor: tokens.colors.primary,
                color: '#ffffff',
                borderRadius: `${tokens.borderRadiusSm}px`,
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                '&:hover': { bgcolor: '#222222' }
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportCSV}
              sx={{
                borderColor: tokens.colors.primary,
                color: tokens.colors.primary,
                borderRadius: `${tokens.borderRadiusSm}px`,
                textTransform: 'none',
                fontWeight: 700,
                flex: 1,
                '&:hover': { borderColor: tokens.colors.primary, bgcolor: tokens.colors.bg }
              }}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </DashboardCard>

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Transaction Payout Ledger" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Receipt Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Booking ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Captain</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Payment Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p) => {
                  let badgeStatus = p.status ? p.status.toUpperCase() : 'PENDING';
                  if (badgeStatus === 'SUCCESS') badgeStatus = 'PAID';
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{p.receipt_number || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{p.tracking_id || p.booking}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.customer_name || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.worker_name || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{p.method ? p.method.toUpperCase() : 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>₹{p.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={badgeStatus}
                          color={badgeStatus === 'PAID' ? 'success' : badgeStatus === 'FAILED' ? 'error' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transaction_id || 'N/A'}</TableCell>
                      <TableCell sx={{ color: tokens.colors.textSecondary }}>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<PaymentIcon />}
                        title="No Payouts Logged"
                        description="There are no payment history entries registered on the system ledger matching filters."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 7. BILLS VIEW
// ----------------------------------------------------
const BillsView = ({ hideHeader }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [openBillDialog, setOpenBillDialog] = useState(false);

  const fetchBills = async () => {
    try {
      const res = await api.get('accounts/admin/bills/', {
        params: { search: search || undefined }
      });
      setBills(res.data);
    } catch (err) {
      toast.error('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setLoading(true);
      fetchBills();
    }
  };

  const handleViewBillDetails = (bill) => {
    setSelectedBill(bill);
    setOpenBillDialog(true);
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Invoice & Bill Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track labour fees, spare parts receipts, and inspect copies of uploaded supplier invoices.
          </Typography>
        </Box>
      )}

      {/* Search Header */}
      <DashboardCard>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Bill Number, Booking Tracking ID... (Press Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={fetchBills}
            sx={{
              bgcolor: tokens.colors.primary,
              color: '#ffffff',
              borderRadius: `${tokens.borderRadiusSm}px`,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#222222' }
            }}
          >
            Filter
          </Button>
        </Box>
      </DashboardCard>

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Invoices Registry" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Bill Number</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Booking ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Captain</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Labour Fee</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>GST (18%)</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>#INV-{b.id + 5000}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{b.booking_detail?.tracking_id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{b.booking_detail?.customer?.full_name}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{b.booking_detail?.worker?.full_name || 'N/A'}</TableCell>
                    <TableCell>₹{b.labour_charges}</TableCell>
                    <TableCell>₹{b.gst}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: tokens.colors.primary }}>₹{b.grand_total}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewBillDetails(b)}
                        sx={{
                          borderColor: tokens.borderColor,
                          color: tokens.colors.primary,
                          fontWeight: 700,
                          borderRadius: `${tokens.borderRadiusSm}px`,
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: tokens.colors.primary,
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        Inspect Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {bills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<ReceiptIcon />}
                        title="No Bills on File"
                        description="There are no billing invoices matching your search parameters on the registry."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}

      {/* Bill Detailed View Dialog */}
      {selectedBill && (
        <Dialog open={openBillDialog} onClose={() => setOpenBillDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Invoice Summary — #INV-{selectedBill.id + 5000}</Typography>
            <IconButton onClick={() => setOpenBillDialog(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: tokens.borderColor }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" uppercase>Booking Reference</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedBill.booking_detail?.tracking_id} ({selectedBill.booking_detail?.service_category_detail?.name})</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" uppercase>Customer</Typography>
                <Typography variant="body2">{selectedBill.booking_detail?.customer?.full_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="700" uppercase>Captain Professional</Typography>
                <Typography variant="body2">{selectedBill.booking_detail?.worker?.full_name || 'Unassigned'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" fontWeight="700" uppercase gutterBottom sx={{ mt: 1 }}>Purchased Spare Parts / Spare Items List</Typography>
                {selectedBill.items && selectedBill.items.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: `${tokens.borderRadiusSm}px`, borderColor: tokens.borderColor }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                          <TableCell sx={{ fontWeight: 600 }}>Part Name</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBill.items.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell>{i.part_name}</TableCell>
                            <TableCell align="center">{i.quantity}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{i.price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No spare items recorded.</Typography>
                )}
              </Grid>

              {/* Uploaded Supplier Copy */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" fontWeight="700" uppercase gutterBottom sx={{ mt: 1 }}>Spare Parts Store Receipt Photo</Typography>
                {selectedBill.booking_detail?.spare_part_photo ? (
                  <Box component="img" src={buildMediaUrl(selectedBill.booking_detail.spare_part_photo)} sx={{ width: '100%', height: 180, objectFit: 'contain', border: `1px solid ${tokens.borderColor}`, borderRadius: `${tokens.borderRadiusSm}px` }} />
                ) : (
                  <Typography variant="caption" color="text.disabled">No receipt photo uploaded</Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" fontWeight="700" uppercase gutterBottom sx={{ mt: 1 }}>Offsite Workshop Store Invoice Photo</Typography>
                {selectedBill.booking_detail?.invoice_photo ? (
                  <Box component="img" src={buildMediaUrl(selectedBill.booking_detail.invoice_photo)} sx={{ width: '100%', height: 180, objectFit: 'contain', border: `1px solid ${tokens.borderColor}`, borderRadius: `${tokens.borderRadiusSm}px` }} />
                ) : (
                  <Typography variant="caption" color="text.disabled">No workshop invoice photo uploaded</Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenBillDialog(false)} sx={{ fontWeight: 700 }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 8. RATINGS & REVIEWS VIEW
// ----------------------------------------------------
const ReviewsView = ({ hideHeader }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingVal, setRatingVal] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await api.get('accounts/admin/ratings/', {
        params: { rating: ratingVal || undefined }
      });
      setReviews(res.data);
    } catch (err) {
      toast.error('Failed to load ratings list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingVal]);

  const handleToggleHide = async (reviewId) => {
    try {
      await api.post(`accounts/admin/ratings/${reviewId}/hide/`);
      toast.success('Review visibility state toggled.');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to hide/show review.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Ratings & Reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor service feedback, filter ratings, and hide inappropriate or bad language reviews.
          </Typography>
        </Box>
      )}

      {/* Filter Header */}
      <DashboardCard>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Rating</InputLabel>
          <Select
            value={ratingVal}
            onChange={(e) => setRatingVal(e.target.value)}
            label="Filter by Rating"
          >
            <MenuItem value="">All Ratings</MenuItem>
            <MenuItem value="5">5 Stars</MenuItem>
            <MenuItem value="4">4 Stars</MenuItem>
            <MenuItem value="3">3 Stars</MenuItem>
            <MenuItem value="2">2 Stars</MenuItem>
            <MenuItem value="1">1 Star</MenuItem>
          </Select>
        </FormControl>
      </DashboardCard>

      {loading ? (
        <LinearProgress color="primary" />
      ) : (
        <DashboardCard title="Ratings & Reviews History" noPadding>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Booking</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Captain</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Review</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Visibility</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>{r.tracking_id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.customer_name}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.worker_name}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ color: '#FBBC05', fontSize: 18 }} />
                        <Typography variant="body2" fontWeight="bold">{r.rating}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: '300px', color: tokens.colors.textSecondary, fontWeight: 500 }}>
                      {r.review || <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>No text review</Typography>}
                    </TableCell>
                    <TableCell>
                      {r.is_hidden ? (
                        <Chip label="HIDDEN" color="error" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      ) : (
                        <Chip label="VISIBLE" color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        color={r.is_hidden ? 'success' : 'error'}
                        onClick={() => handleToggleHide(r.id)}
                        sx={{
                          borderRadius: `${tokens.borderRadiusSm}px`,
                          textTransform: 'none',
                          fontWeight: 700
                        }}
                      >
                        {r.is_hidden ? 'Show' : 'Hide Review'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0 }}>
                      <EmptyState
                        icon={<StarIcon />}
                        title="No Reviews Found"
                        description="There are no ratings or reviews logged by customers matching the filter."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardCard>
      )}
    </Box>
  );
};

// ----------------------------------------------------
// 9. REPORTS & ANALYTICS VIEW
// ----------------------------------------------------
const ReportsView = ({ hideHeader }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('accounts/admin/reports/');
        setReportData(res.data);
      } catch (err) {
        toast.error('Failed to load analysis metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleExport = async () => {
    try {
      const response = await api.get('accounts/admin/reports/?export=csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'workizo_bookings_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV Report exported successfully.');
    } catch (err) {
      toast.error('Failed to generate CSV export.');
    }
  };

  if (loading) {
    return <LinearProgress color="primary" />;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate detailed platform audit logs, check category revenues, and export CSV logs.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleExport}
            startIcon={<FileDownloadIcon />}
            sx={{
              bgcolor: tokens.colors.primary,
              color: '#ffffff',
              borderRadius: `${tokens.borderRadiusSm}px`,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#222222' }
            }}
          >
            Export CSV Report
          </Button>
        </Box>
      )}

      <DashboardGrid>
        <Box sx={span.half}>
          <DashboardCard>
            <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Success Completion Rate</Typography>
              <Typography variant="h3" fontWeight={700} sx={{ mt: 1.5, color: '#34A853', fontFamily: 'Outfit' }}>
                {reportData.successRate}%
              </Typography>
            </Box>
          </DashboardCard>
        </Box>
        <Box sx={span.half}>
          <DashboardCard>
            <Box sx={{ py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Cancellation Rate</Typography>
              <Typography variant="h3" fontWeight={700} sx={{ mt: 1.5, color: '#EA4335', fontFamily: 'Outfit' }}>
                {reportData.cancelRate}%
              </Typography>
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>

      {/* Revenue per Service Category Table */}
      <DashboardCard title="Revenue Metrics per Service Category" noPadding>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: tokens.colors.bg }}>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="center">Total Bookings Count</TableCell>
                <TableCell sx={{ fontWeight: 600, fontFamily: 'Outfit', color: tokens.colors.primary }} align="right">Aggregated Grand Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.categories && reportData.categories.map((c, idx) => (
                <TableRow key={idx} hover>
                  <TableCell fontWeight="bold" sx={{ fontFamily: 'Outfit', fontWeight: 700 }}>{c.service_category__name || 'Unspecified'}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{c.count}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>₹{c.total_rev ? parseFloat(c.total_rev).toFixed(2) : '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>
    </Box>
  );
};

// ----------------------------------------------------
// 10. NOTIFICATIONS BROADCAST VIEW
// ----------------------------------------------------
const NotificationsView = ({ hideHeader }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all_customers');

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('accounts/admin/notifications/');
      setAnnouncements(res.data);
    } catch (err) {
      toast.error('Failed to load announcement log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please enter a title and message.');
      return;
    }
    try {
      await api.post('accounts/admin/notifications/', {
        title,
        message,
        recipient_type: recipientType
      });
      toast.success('Broadcast announcement sent successfully!');
      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to send announcement.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Broadcast Announcements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Send platform maintenance notices, support announcements, or service updates to users.
          </Typography>
        </Box>
      )}

      <DashboardGrid>
        {/* Creator Form */}
        <Box sx={span.third}>
          <DashboardCard title="Create Announcement">
            <form onSubmit={handleBroadcast}>
              <Box display="flex" flexDirection="column" gap={2.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Target Recipients</InputLabel>
                  <Select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    label="Target Recipients"
                  >
                    <MenuItem value="all_customers">All Registered Customers</MenuItem>
                    <MenuItem value="all_captains">All Registered Captains</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Announcement Title"
                  size="small"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <TextField
                  label="Announcement Message Content"
                  size="small"
                  fullWidth
                  multiline
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: tokens.colors.primary,
                    color: '#ffffff',
                    borderRadius: `${tokens.borderRadiusSm}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1,
                    '&:hover': { bgcolor: '#222222' }
                  }}
                >
                  Broadcast Announcement
                </Button>
              </Box>
            </form>
          </DashboardCard>
        </Box>

        {/* History Log */}
        <Box sx={span.twoThirds}>
          <DashboardCard title="Sent Announcements History Log">
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {announcements.map((a) => (
                  <Box key={a.id} sx={{ p: 2.5, border: `1px solid ${tokens.borderColor}`, borderRadius: `${tokens.borderRadiusSm}px`, bgcolor: tokens.colors.bg }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1} gap={2}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'Outfit' }}>{a.title}</Typography>
                      <Chip label={a.recipient_type.replace('_', ' ').toUpperCase()} size="small" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>{a.message}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>
                      Sent on: {new Date(a.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
                {announcements.length === 0 && (
                  <EmptyState
                    icon={<CampaignIcon />}
                    title="No Announcements Sent"
                    description="You haven't broadcasted any updates or notices yet."
                  />
                )}
              </Box>
            )}
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </Box>
  );
};

// ----------------------------------------------------
// 11. SYSTEM SETTINGS VIEW
// ----------------------------------------------------
const SettingsView = ({ hideHeader }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [companyName, setCompanyName] = useState('Workizo');
  const [gstPercentage, setGstPercentage] = useState(18.00);
  const [supportEmail, setSupportEmail] = useState('workizo24.7@gmail.com');
  const [supportPhone, setSupportPhone] = useState('+919377631331');
  const [contactDetails, setContactDetails] = useState('');
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('accounts/admin/settings/');
        const s = res.data;
        setCompanyName(s.company_name);
        setGstPercentage(parseFloat(s.gst_percentage));
        setSupportEmail(s.support_email);
        setSupportPhone(s.support_phone);
        setContactDetails(s.contact_details || '');
        setTerms(s.terms_conditions || '');
        setPrivacy(s.privacy_policy || '');
      } catch (err) {
        toast.error('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('accounts/admin/settings/', {
        company_name: companyName,
        gst_percentage: gstPercentage,
        support_email: supportEmail,
        support_phone: supportPhone,
        contact_details: contactDetails,
        terms_conditions: terms,
        privacy_policy: privacy
      });
      toast.success('System Settings updated successfully!');
    } catch (err) {
      toast.error('Failed to update configurations.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LinearProgress color="primary" />;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure platform parameters, GST values, support channels, and legal copy.
          </Typography>
        </Box>
      )}

      <DashboardCard title="System Parameters Form">
        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Name"
                size="small"
                fullWidth
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="GST Tax Percentage (%)"
                size="small"
                type="number"
                fullWidth
                value={gstPercentage}
                onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0.0)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Support Contact Email"
                size="small"
                type="email"
                fullWidth
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Support Help Phone"
                size="small"
                fullWidth
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Corporate Address / Contacts Info"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Terms & Conditions Copy"
                size="small"
                fullWidth
                multiline
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Privacy Policy Copy"
                size="small"
                fullWidth
                multiline
                rows={3}
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  bgcolor: tokens.colors.primary,
                  color: '#ffffff',
                  borderRadius: `${tokens.borderRadiusSm}px`,
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1,
                  px: 4,
                  '&:hover': { bgcolor: '#222222' }
                }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DashboardCard>
    </Box>
  );
};

// ----------------------------------------------------
// 12. ADMIN PROFILE VIEW
// ----------------------------------------------------
const ProfileView = ({ hideHeader }) => {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('accounts/admin/profile/');
        setName(res.data.full_name);
        setEmail(res.data.email);
        setPhone(res.data.phone || '');
      } catch (err) {
        toast.error('Failed to load profile details.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await api.put('accounts/admin/profile/', {
        full_name: name,
        email,
        phone
      });
      toast.success('Admin Profile updated successfully.');
    } catch (err) {
      toast.error('Failed to save profile details.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error('Please input password values.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post('accounts/admin/profile/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      toast.success('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const errorMsg = err.response?.data?.old_password?.[0] || 'Failed to change password.';
      toast.error(errorMsg);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (profileLoading) {
    return <LinearProgress color="primary" />;
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {!hideHeader && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight={700} fontFamily="Outfit" color="#0F0F14">
            Admin Profile Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your account credentials, notifications phone, and updates password.
          </Typography>
        </Box>
      )}

      <DashboardGrid>
        {/* Info Edit */}
        <Box sx={span.half}>
          <DashboardCard title="Update Profile Details">
            <form onSubmit={handleUpdateProfile}>
              <Stack spacing={2.5}>
                <TextField
                  label="Full Name"
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Email Address"
                  size="small"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Mobile Contact Phone"
                  size="small"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={profileSaving}
                  sx={{
                    bgcolor: tokens.colors.primary,
                    color: '#ffffff',
                    borderRadius: `${tokens.borderRadiusSm}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1,
                    '&:hover': { bgcolor: '#222222' }
                  }}
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </form>
          </DashboardCard>
        </Box>

        {/* Password update */}
        <Box sx={span.half}>
          <DashboardCard title="Change Account Password">
            <form onSubmit={handleChangePassword}>
              <Stack spacing={2.5}>
                <TextField
                  label="Current Password"
                  type="password"
                  size="small"
                  fullWidth
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <TextField
                  label="New Secure Password"
                  type="password"
                  size="small"
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordSaving}
                  sx={{
                    bgcolor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: `${tokens.borderRadiusSm}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1,
                    '&:hover': { bgcolor: '#dc2626' }
                  }}
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </Stack>
            </form>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </Box>
  );
};

export default AdminDashboard;
