import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, List, ListItem, ListItemText, Skeleton, Grid
} from '@mui/material';
import { motion } from 'framer-motion';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaymentsIcon from '@mui/icons-material/Payments';
import api from '../services/api';
import toast from 'react-hot-toast';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid 
} from '../components/dashboard';

function WorkerWallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const walletRes = await api.get('/api/workers/wallet/');
      setWallet(walletRes.data);

      const statsRes = await api.get('/api/workers/dashboard-stats/');
      setStats(statsRes.data);
    } catch (e) {
      toast.error('Failed to load wallet ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const handleWithdrawFunds = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount)) {
      return toast.error('Please enter a valid numeric amount');
    }
    const val = parseFloat(withdrawAmount);
    if (val <= 0) {
      return toast.error('Amount must be positive');
    }
    if (val > parseFloat(wallet.current_balance)) {
      return toast.error('Insufficient balance to payout');
    }

    setWithdrawing(true);
    try {
      await api.post('/api/workers/wallet/withdraw/', { amount: val });
      toast.success(`Withdrawal of ₹${val} successfully credited to linked bank account!`);
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchWalletDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payout processing failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const summary = (
    <SummaryGrid columns={4}>
      <SummaryCard
        label="Settlement Balance"
        value={`₹${wallet?.current_balance || '0.00'}`}
        icon={<AccountBalanceWalletIcon />}
        accentColor="#1A73E8"
        loading={loading}
      />
      <SummaryCard
        label="Pending Payouts"
        value={`₹${wallet?.pending_balance || '0.00'}`}
        icon={<HourglassEmptyIcon />}
        accentColor="#FBBC05"
        loading={loading}
      />
      <SummaryCard
        label="Weekly Income"
        value={`₹${stats?.weekly_earnings || '0.00'}`}
        icon={<TrendingUpIcon />}
        accentColor="#34A853"
        loading={loading}
      />
      <SummaryCard
        label="Monthly Income"
        value={`₹${stats?.monthly_earnings || '0.00'}`}
        icon={<PaymentsIcon />}
        accentColor="#EA4335"
        loading={loading}
      />
    </SummaryGrid>
  );

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/captain/dashboard' },
        { label: 'Settlement Wallet' }
      ]}
      title="Settlement Wallet & Payouts"
      description="Manage your settlement transactions, view earnings milestones, and execute bank payouts."
      summary={summary}
      loading={loading}
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
        {/* Left Column: Balance Card & Timelines */}
        <Box sx={span.oneThird}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Withdrawal Card */}
            <DashboardCard title="Bank Payout Transfer" subtitle="Instantly transfer wallet funds into your bank account">
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Verify bank details under profile settings prior to issuing transactions.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={parseFloat(wallet?.current_balance) <= 0}
                  sx={{ 
                    bgcolor: tokens.colors.primary, 
                    color: '#ffffff', 
                    py: 1.5, 
                    borderRadius: `${tokens.borderRadiusSm}px`, 
                    textTransform: 'none',
                    fontWeight: '700',
                    '&:hover': { bgcolor: '#23232F' }
                  }}
                >
                  Withdraw Payout to Bank
                </Button>
              </Box>
            </DashboardCard>

            {/* Earnings Milestones */}
            <DashboardCard title="Earnings Milestones" subtitle="Summary of periodic payouts">
              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1.25 }} divider>
                  <ListItemText primary="Today's Earnings" />
                  <Typography variant="body2" fontWeight={700}>
                    ₹{stats?.today_earnings}
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1.25 }} divider>
                  <ListItemText primary="Weekly Earnings" />
                  <Typography variant="body2" fontWeight={700}>
                    ₹{stats?.weekly_earnings}
                  </Typography>
                </ListItem>
                <ListItem sx={{ px: 0, py: 1.25 }}>
                  <ListItemText primary="Monthly Earnings" />
                  <Typography variant="body2" fontWeight={700}>
                    ₹{stats?.monthly_earnings}
                  </Typography>
                </ListItem>
              </List>
            </DashboardCard>
          </Box>
        </Box>

        {/* Right Column: Transaction History Ledger */}
        <Box sx={span.twoThirds}>
          <DashboardCard title="Wallet Transactions Ledger" subtitle="Detailed audit logging of completed invoices and payouts">
            <List disablePadding>
              {wallet?.transactions?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PaymentsIcon sx={{ fontSize: 48, color: tokens.colors.textMuted, mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">No wallet activity logs found</Typography>
                </Box>
              ) : (
                wallet?.transactions?.map((txn, index) => (
                  <React.Fragment key={txn.id}>
                    <ListItem sx={{ py: 2, px: 0 }}>
                      <ListItemText
                        primary={txn.description}
                        primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                        secondary={new Date(txn.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      />
                      <Typography 
                        variant="body1" 
                        fontWeight={700} 
                        color={txn.transaction_type === 'credit' ? 'success.main' : 'error.main'}
                      >
                        {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount}
                      </Typography>
                    </ListItem>
                    {index < wallet.transactions.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </DashboardCard>
        </Box>
      </DashboardGrid>

      {/* Payout Withdrawal Dialog */}
      <Dialog 
        open={withdrawModalOpen} 
        onClose={() => !withdrawing && setWithdrawModalOpen(false)}
        PaperProps={{ style: { borderRadius: `${tokens.borderRadius}px`, padding: '8px' } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
          Execute Bank Payout Transfer
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Funds will be instantly transferred into your linked settlement account: <br />
            <b>Account:</b> {stats?.bank_account || 'xxxxxx'} | <b>IFSC:</b> {stats?.ifsc_code || 'xxxx'}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Payout Amount (₹)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawModalOpen(false)} disabled={withdrawing} sx={{ color: tokens.colors.primary }}>
            Cancel
          </Button>
          <Button 
            onClick={handleWithdrawFunds} 
            variant="contained" 
            disabled={withdrawing}
            sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: `${tokens.borderRadiusSm}px` }}
          >
            {withdrawing ? 'Processing...' : 'Confirm Bank Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
  );
}

export default WorkerWallet;
