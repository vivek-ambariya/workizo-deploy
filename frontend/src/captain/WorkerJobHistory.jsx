import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Divider, TextField, MenuItem, Skeleton, InputAdornment, Grid
} from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import HandymanIcon from '@mui/icons-material/Handyman';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api, { buildApiUrl } from '../services/api';
import toast from 'react-hot-toast';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid 
} from '../components/dashboard';

function WorkerJobHistory() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/bookings/my-bookings/');
      setJobs(res.data);
    } catch (e) {
      toast.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const response = await api.get(`/api/billing/${bookingId}/download-invoice/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.id.toString().includes(search) || 
      job.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.problem_type?.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'completed') return matchesSearch && job.status === 'completed';
    if (statusFilter === 'pending') return matchesSearch && !['completed', 'cancelled', 'searching'].includes(job.status);
    if (statusFilter === 'cancelled') return matchesSearch && job.status === 'cancelled';
    return matchesSearch;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { color: 'success.main', bg: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.15)' };
      case 'cancelled': return { color: 'error.main', bg: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.15)' };
      case 'searching': return { color: 'info.main', bg: 'rgba(2, 136, 209, 0.08)', border: '1px solid rgba(2, 136, 209, 0.15)' };
      default: return { color: 'warning.main', bg: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.15)' };
    }
  };

  const activeJobs = jobs.filter(j => !['completed', 'cancelled', 'searching'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled');

  const summary = (
    <SummaryGrid columns={4}>
      <SummaryCard
        label="Total Job Requests"
        value={jobs.length}
        icon={<HistoryIcon />}
        accentColor="#1A73E8"
        loading={loading}
      />
      <SummaryCard
        label="Completed Job Runs"
        value={completedJobs.length}
        icon={<HandymanIcon />}
        accentColor="#34A853"
        loading={loading}
      />
      <SummaryCard
        label="Cancelled / Rejected"
        value={cancelledJobs.length}
        icon={<CancelIcon />}
        accentColor="#EA4335"
        loading={loading}
      />
      <SummaryCard
        label="Active Operations"
        value={activeJobs.length}
        icon={<OpenInNewIcon />}
        accentColor="#FBBC05"
        loading={loading}
      />
    </SummaryGrid>
  );

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/captain/dashboard' },
        { label: 'Job History' }
      ]}
      title="Job History Ledger"
      description="Search, filter, and review all your assigned job runs and invoices."
      summary={summary}
      actions={
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/captain/dashboard')}
          sx={{ color: tokens.colors.primary, textTransform: 'none', fontWeight: 700 }}
        >
          Back to Dashboard
        </Button>
      }
    >
      <DashboardGrid>
        {/* Left Column: Filter Controls and List */}
        <Box sx={span.twoThirds}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Search Filters */}
            <DashboardCard title="Search & Filter Ledger" subtitle="Look up specific tasks by client name or ID">
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    placeholder="Search by Job ID, Customer Name, or Problem..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    label="Filter Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Jobs</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Active / Pending</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DashboardCard>

            {/* List */}
            {loading ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} variant="rectangular" height={140} sx={{ borderRadius: `${tokens.borderRadius}px` }} />
                ))}
              </Box>
            ) : filteredJobs.length === 0 ? (
              <DashboardCard title="No Job Runs Found">
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <HandymanIcon sx={{ fontSize: 48, color: tokens.colors.textMuted, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No jobs matched your current filter criteria.
                  </Typography>
                </Box>
              </DashboardCard>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {filteredJobs.map((job, idx) => {
                  const style = getStatusStyle(job.status);
                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                    >
                      <Box sx={{
                        p: 3, 
                        borderRadius: `${tokens.borderRadius}px`,
                        border: `1px solid ${tokens.borderColor}`,
                        bgcolor: tokens.colors.paper,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: tokens.transition,
                        '&:hover': {
                          boxShadow: tokens.shadowHover,
                          borderColor: tokens.colors.accent,
                        }
                      }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
                              <Typography variant="subtitle1" fontWeight={700}>
                                Job #{job.id}
                              </Typography>
                              <Box sx={{ px: 1.25, py: 0.25, borderRadius: '4px', bgcolor: style.bg, border: style.border }}>
                                <Typography variant="caption" fontWeight={700} color={style.color}>
                                  {job.status.replace('_', ' ').toUpperCase()}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="body2" fontWeight={600}>
                              Customer: {job.customer?.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Problem: {job.problem_type} — {job.problem_description?.substring(0, 80)}...
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Booked: <b>{new Date(job.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b>
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { md: 'flex-end' }, gap: 2 }}>
                            <Box sx={{ textAlign: { md: 'right' } }}>
                              <Typography variant="caption" color="text.secondary">Completion Date</Typography>
                              <Typography variant="body2" fontWeight={400}>
                                {new Date(job.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                              </Typography>
                            </Box>

                            <Box display="flex" gap={1.5}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate(`/captain/job/${job.id}`)}
                                endIcon={<OpenInNewIcon fontSize="small" />}
                                sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, borderColor: tokens.colors.primary, color: tokens.colors.primary, fontWeight: 700 }}
                              >
                                Details
                              </Button>
                              
                              {job.status === 'completed' && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleDownloadInvoice(job.id)}
                                  startIcon={<DownloadIcon />}
                                  sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, bgcolor: tokens.colors.primary, color: '#ffffff', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                                >
                                  Invoice
                                </Button>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Column: Information Guide / Policy Details */}
        <Box sx={span.oneThird}>
          <Box display="flex" flexDirection="column" gap={3}>
            <DashboardCard title="Ledger Information" subtitle="Understanding your history reports">
              <Typography variant="body2" color="text.secondary" paragraph>
                This ledger logs all customer requests you have accepted. You can download invoice PDFs for completed orders at any time.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                To disputing settlement payouts, contact technical support with the respective <b>Job ID #</b>.
              </Typography>
            </DashboardCard>

            <DashboardCard title="Performance Review" subtitle="How completed jobs impact rating">
              <Typography variant="body2" color="text.secondary" paragraph>
                Client reviews and completion rates are updated live. Consistently completing requests on time maintains a higher status and visibility ranking on customer search queries.
              </Typography>
            </DashboardCard>
          </Box>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
}

const CancelIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default WorkerJobHistory;
