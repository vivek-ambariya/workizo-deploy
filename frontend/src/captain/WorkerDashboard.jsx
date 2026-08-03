import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Switch, FormControlLabel, Alert, Divider, List, ListItem, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, LinearProgress,
  DialogContentText, Skeleton, Avatar, Tooltip as MuiTooltip, Grid
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { buildWsUrl } from '../services/api';
import toast from 'react-hot-toast';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StarIcon from '@mui/icons-material/Star';
import HandymanIcon from '@mui/icons-material/Handyman';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid 
} from '../components/dashboard';

function WorkerDashboard() {
  const { user, updateProfileState } = useAuth();
  const navigate = useNavigate();
  
  const online = !!user?.profile?.online_status;
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  
  const [loadingStats, setLoadingStats] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Sound Alert ref
  const alertAudio = useRef(null);

  // WebSocket reference
  const notiWs = useRef(null);
  const pollingInterval = useRef(null);

  const loadDashboardData = async () => {
    try {
      const statsRes = await api.get('/api/workers/dashboard-stats/');
      setStats(statsRes.data);
      
      // Sync online status and approval status in auth state if they mismatch
      const backendOnline = !!statsRes.data.online_status;
      const backendApproval = statsRes.data.verification_status;
      const frontendOnline = !!user?.profile?.online_status;
      const frontendApproval = user?.profile?.approval_status;

      if (backendOnline !== frontendOnline || backendApproval !== frontendApproval) {
        updateProfileState({
          user: user,
          profile: {
            ...user.profile,
            online_status: backendOnline,
            approval_status: backendApproval
          }
        });
      }

      const walletRes = await api.get('/api/workers/wallet/');
      setWallet(walletRes.data);

      const jobsRes = await api.get('/api/bookings/my-bookings/');
      setRecentJobs(jobsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      const res = await api.get('/api/bookings/available-requests/');
      setAvailableBookings(res.data);
    } catch (err) {
      console.error('Error fetching available requests:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    alertAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
    
    return () => {
      if (notiWs.current) notiWs.current.close();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // Sync available bookings fetching and WebSocket connections based on online state
  useEffect(() => {
    let isActive = true;
    let socket = null;
    let reconnectTimer = null;
    const approvalStatus = user?.profile?.approval_status;

    if (online && approvalStatus === 'approved') {
      fetchAvailableBookings();

      // Start periodic 5s polling as backup
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(fetchAvailableBookings, 5000);

      let pingInterval = null;

      // StrictMode-safe notification WebSocket with auto-reconnect
      const connect = () => {
        if (!isActive) return;
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const wsUrl = buildWsUrl('/ws/notifications/', `?token=${token}`);
        socket = new WebSocket(wsUrl);
        notiWs.current = socket;

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
            if (payload.type === 'booking_available') {
              const booking = payload.booking;
              setAvailableBookings((prev) => {
                if (prev.some(b => b.id === booking.id)) return prev;
                return [booking, ...prev];
              });
              try { alertAudio.current.play(); } catch (e) { /* autoplay blocked */ }
              toast.success(`New request #${booking.id} matching your skills is available!`);
            } else if (payload.type === 'booking_taken') {
              const takenId = payload.booking_id;
              setAvailableBookings((prev) => prev.filter(b => b.id !== takenId));
            }
          } catch (err) {
            console.error('[WS] Notification message error:', err);
          }
        };

        socket.onerror = (error) => {
          socket.close();
        };

        socket.onclose = (event) => {
          if (pingInterval) clearInterval(pingInterval);
          notiWs.current = null;
          if (event.code === 4003) {
            return;
          }
          if (isActive) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      };

      connect();
    } else {
      setAvailableBookings([]);
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      if (notiWs.current) {
        console.log('[WS] Closing connection because online status is false or user is not approved');
        notiWs.current.close();
        notiWs.current = null;
      }
    }

    return () => {
      isActive = false;
      clearTimeout(reconnectTimer);
      if (socket) {
        console.log('[WS] Cleaning up socket connection');
        socket.close();
      }
    };
  }, [online, user?.profile?.approval_status, user?.id]);

  const handleOnlineToggle = async (event) => {
    setTogglingOnline(true);
    const newStatus = event.target.checked;
    try {
      const res = await api.put('/api/accounts/profile/', {
        online_status: newStatus
      });
      updateProfileState(res.data);
      toast.success(newStatus ? 'You are now Online! Listening for matching bookings.' : 'You are now Offline.');
      
      // Reload stats to verify sync
      const statsRes = await api.get('/api/workers/dashboard-stats/');
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change online status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    setAcceptingId(bookingId);
    try {
      const res = await api.post(`/api/bookings/bookings/${bookingId}/accept/`);
      toast.success('Service booking accepted successfully!');
      navigate(`/captain/job/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to accept booking. Already taken?');
      fetchAvailableBookings();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setRejectingId(bookingId);
    try {
      await api.post(`/api/bookings/bookings/${bookingId}/reject/`);
      toast.success('Service booking request dismissed.');
      setAvailableBookings((prev) => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject booking request');
    } finally {
      setRejectingId(null);
    }
  };

  if (loadingStats) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <Skeleton variant="rectangular" height={120} sx={{ mb: 4, borderRadius: '12px' }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '12px' }} />
      </Box>
    );
  }

  const activeJob = recentJobs.find(j => !['completed', 'cancelled', 'searching'].includes(j.status));

  const summary = (
    <SummaryGrid columns={4}>
      <SummaryCard
        label="Today's Earnings"
        value={`₹${stats?.today_earnings}`}
        icon={<AccountBalanceWalletIcon />}
        accentColor="#1A73E8"
        loading={loadingStats}
      />
      <SummaryCard
        label="Weekly Earnings"
        value={`₹${stats?.weekly_earnings}`}
        icon={<SignalCellularAltIcon />}
        accentColor="#34A853"
        loading={loadingStats}
      />
      <SummaryCard
        label="Total Service Jobs"
        value={stats?.total_jobs || 0}
        icon={<HandymanIcon />}
        accentColor="#FBBC05"
        loading={loadingStats}
      />
      <SummaryCard
        label="Average Rating"
        value={`★ ${stats?.rating || '0.0'}`}
        icon={<StarIcon />}
        accentColor="#EA4335"
        loading={loadingStats}
      />
    </SummaryGrid>
  );

  return (
    <DashboardPage
      breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Captain Dashboard' }]}
      title={stats?.welcome_message || 'Welcome back!'}
      description={stats ? `Service: ${stats.service_category} | Approval Status: ${stats.verification_status?.toUpperCase()}` : ''}
      summary={summary}
      loading={loadingStats}
      actions={
        <MuiTooltip title={stats?.verification_status !== 'approved' ? "KYC verification pending admin approval" : ""}>
          <span>
            <FormControlLabel
              control={
                <Switch
                  checked={online}
                  onChange={handleOnlineToggle}
                  disabled={togglingOnline || stats?.verification_status !== 'approved'}
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
                  <Typography variant="subtitle2" fontWeight={700}>
                    {online ? 'ONLINE' : 'OFFLINE'}
                  </Typography>
                  {online && (
                    <Box sx={{
                      width: 8, height: 8, bgcolor: 'success.main', borderRadius: '50%', ml: 1.5,
                      animation: 'pulse 1.5s infinite'
                    }} />
                  )}
                </Box>
              }
            />
          </span>
        </MuiTooltip>
      }
    >
      {/* Verification Warning Banners */}
      {stats?.verification_status === 'pending' && (
        <Alert severity="warning" sx={{ mb: 1, borderRadius: `${tokens.borderRadiusSm}px` }}>
          Your KYC document verification status is pending approval. You will receive service bookings as soon as the administrator approves your profile.
        </Alert>
      )}
      {stats?.verification_status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: `${tokens.borderRadiusSm}px` }}>
          Your government KYC documents were rejected. Please update your Aadhaar/PAN photo files under Profile settings.
        </Alert>
      )}

      <DashboardGrid>
        {/* Left Section: Active Job Offer & Performance Graph */}
        <Box sx={span.twoThirds}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Active Job Callout */}
            {activeJob && (
              <DashboardCard 
                title="Active Jobs" 
                subtitle={`Job ID: #${activeJob.id} | Status: ${activeJob.status.replace('_', ' ').toUpperCase()}`}
                highlight
              >
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2.5, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px` }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Customer: {activeJob.customer?.full_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Service Address: {activeJob.address}, {activeJob.city}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/captain/job/${activeJob.id}`)}
                      sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', px: 3, py: 1.25, borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Resume Job Workspace
                    </Button>
                  </Box>
                </Box>
              </DashboardCard>
            )}

            {/* Available Bookings Board Feed */}
            <DashboardCard 
              title="Incoming Requests" 
              subtitle="Live job requests matching your skills nearby Ahmedabad"
            >
              {!online ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={600}>You are Offline</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Toggle your status to ONLINE in the top banner to start receiving client request cards.
                  </Typography>
                </Box>
              ) : availableBookings.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={600}>No bookings nearby</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Listening for real customer service requests matching your skill category...
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {availableBookings.map((b) => (
                    <Grid item xs={12} sm={6} key={b.id}>
                      <Box sx={{
                        p: 3, 
                        borderRadius: `${tokens.borderRadius}px`, 
                        border: `1px solid ${tokens.borderColor}`,
                        bgcolor: tokens.colors.paper,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        transition: tokens.transition,
                        '&:hover': {
                          boxShadow: tokens.shadowHover,
                          borderColor: tokens.colors.accent,
                        }
                      }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="textSecondary" fontWeight={700}>
                            Booking ID: #{b.id}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ mb: 1 }}>
                          {b.customer?.full_name}
                        </Typography>

                        <Box display="flex" flexDirection="column" gap={0.75} sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Service Category: <span style={{ fontWeight: 700, color: tokens.colors.primary }}>{b.service_category_detail?.name}</span>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Address: <span style={{ fontWeight: 600 }}>{b.address}, {b.city}, {b.state} - {b.pincode}</span>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Distance: <span style={{ fontWeight: 700, color: '#34A853' }}>{b.distance ? `${b.distance} km` : '1.2 km'}</span>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Requested Time: <span style={{ fontWeight: 600 }}>{new Date(b.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Payment Mode: <span style={{ fontWeight: 700, color: '#1A73E8' }}>{b.payment_mode || 'Online / Cash'}</span>
                          </Typography>
                        </Box>
                        
                        <Box sx={{ p: 1.5, mb: 2, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px` }}>
                          <Typography variant="caption" color="text.secondary" display="block">Problem Summary:</Typography>
                          <Typography variant="body2" fontWeight="700">{b.problem_type}</Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box display="flex" gap={2}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleRejectBooking(b.id)}
                            disabled={rejectingId === b.id || acceptingId === b.id}
                            sx={{ borderColor: tokens.borderColor, color: 'text.secondary', textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                          >
                            Reject
                          </Button>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleAcceptBooking(b.id)}
                            disabled={acceptingId === b.id || rejectingId === b.id}
                            sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                          >
                            {acceptingId === b.id ? 'Accepting...' : 'Accept'}
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DashboardCard>

            {/* Performance Earnings Line Chart */}
            <DashboardCard title="Performance Earnings Graph" subtitle="Weekly settlement analytics and trends">
              <Box sx={{ width: '100%', height: 260, mt: 2 }}>
                <ResponsiveContainer>
                  <LineChart data={stats?.performance_graph || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tokens.borderColor} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke={tokens.colors.textSecondary} />
                    <YAxis tickLine={false} axisLine={false} stroke={tokens.colors.textSecondary} />
                    <Tooltip cursor={{ stroke: tokens.colors.accentLight, strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="Amount" stroke={tokens.colors.accent} strokeWidth={3} dot={{ r: 5, fill: tokens.colors.accent }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </DashboardCard>
          </Box>
        </Box>

        {/* Right Section: Sidebar Settlement Wallet & Stats */}
        <Box sx={span.oneThird}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Wallet Balance Card */}
            <DashboardCard title="Settlement Wallet" subtitle="Total complete earnings balance">
              <Box sx={{ py: 1 }}>
                <Typography variant="h3" fontWeight={700} sx={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
                  ₹{stats?.wallet_balance}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Weekly complete earnings: <b>₹{stats?.weekly_earnings}</b>
                </Typography>
                
                <Divider sx={{ my: 2.5 }} />

                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/captain/wallet')}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    View Wallet Ledger
                  </Button>
                </Box>
              </Box>
            </DashboardCard>

            {/* Performance Stats Metrics */}
            <DashboardCard title="Workspace Analytics" subtitle="Your service feedback details">
              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1.5 }} divider>
                  <ListItemText primary="Acceptance Rate" secondary="Percentage of matching jobs accepted" />
                  <Typography variant="body2" fontWeight={700}>
                    {stats?.acceptance_rate}%
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1.5 }} divider>
                  <ListItemText primary="Completion Rate" secondary="Percentage of accepted jobs completed" />
                  <Typography variant="body2" fontWeight={700}>
                    {stats?.completion_rate}%
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1.5 }} divider>
                  <ListItemText primary="Pending Assignments" secondary="Services waiting repair actions" />
                  <Typography variant="body2" fontWeight={700}>
                    {stats?.pending_jobs}
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText primary="Completed Work" secondary="Total customer orders settled" />
                  <Typography variant="body2" fontWeight={700}>
                    {stats?.completed_jobs}
                  </Typography>
                </ListItem>
              </List>
            </DashboardCard>

            {/* Recent Activity Ledger */}
            <DashboardCard title="Recent Activity Logs" subtitle="Live feed updates of your jobs">
              <List disablePadding>
                {stats?.recent_activity?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No recent updates</Typography>
                ) : (
                  stats?.recent_activity?.slice(0, 5).map((act, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 1.25 }} divider={index < 4}>
                      <ListItemText
                        primary={act.action}
                        secondary={act.time}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </DashboardCard>
          </Box>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
}

export default WorkerDashboard;
