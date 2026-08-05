import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Divider, TextField, List, ListItem, ListItemText, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, CircularProgress,
  Badge, Stepper, Step, StepLabel, DialogContentText, MenuItem, Grid
} from '@mui/material';
import api, { buildApiUrl, buildWsUrl } from '../services/api';
import toast from 'react-hot-toast';
import ChatWindow from '../components/ChatWindow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import HandymanIcon from '@mui/icons-material/Handyman';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CancelIcon from '@mui/icons-material/Cancel';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard, 
  SummaryCard, SummaryGrid 
} from '../components/dashboard';

const JOB_TIMELINE = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'Travelling' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'verified', label: 'Verified' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'repair_started', label: 'Repair Started' },
  { key: 'repair_completed', label: 'Repair Completed' },
  { key: 'waiting_approval', label: 'Waiting Approval' },
  { key: 'ready_to_complete', label: 'Payment Paid' },
  { key: 'completed', label: 'Completed' }
];

const getActiveStepIndex = (status) => {
  switch (status) {
    case 'accepted': return 0;
    case 'on_the_way': return 1;
    case 'arrived': return 2;
    case 'verified': return 3;
    case 'inspection': return 4;
    case 'repair_started': return 5;
    case 'repair_completed': return 6;
    case 'waiting_approval': return 7;
    case 'WAITING_FOR_CASH_CONFIRMATION':
    case 'ready_to_complete': return 8;
    case 'completed': return 9;
    default: return 0;
  }
};

function WorkerJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // QR Code Verification
  const [qrCodeInput, setQrCodeInput] = useState('');

  // Cancel Warning Modal
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false);

  // Major Repair Estimator
  const [repairReason, setRepairReason] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [requestingRepair, setRequestingRepair] = useState(false);

  // Workshop Token
  const [workshopStatus, setWorkshopStatus] = useState('item_received');
  const [updatingToken, setUpdatingToken] = useState(false);

  // Media upload files
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [sparePartPhoto, setSparePartPhoto] = useState(null);
  const [invoicePhoto, setInvoicePhoto] = useState(null);
  const [optionalVideo, setOptionalVideo] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Billing states
  const [labourCharges, setLabourCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [spareParts, setSpareParts] = useState([{ part_name: '', quantity: 1, price: '' }]);
  const [supplierInvoice, setSupplierInvoice] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [existingBill, setExistingBill] = useState(null);
  const [confirmCashDialogOpen, setConfirmCashDialogOpen] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const isChatOpenRef = useRef(false);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const ws = useRef(null);

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`/api/bookings/bookings/${id}/`);
      setBooking(res.data);
      setUnreadChats(res.data.unread_chats_count || 0);

      if (['completed', 'waiting_approval', 'repair_completed', 'WAITING_FOR_CASH_CONFIRMATION'].includes(res.data.status)) {
        try {
          const billRes = await api.get(`/api/billing/${id}/get-bill/`);
          setExistingBill(billRes.data);
        } catch (e) {
          setExistingBill(null);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();

    let isActive = true;
    let socket = null;
    let reconnectTimer = null;
    let pingInterval = null;

    const connect = () => {
      if (!isActive) return;
      const token = localStorage.getItem('access_token');
      if (!token) return;
      socket = new WebSocket(buildWsUrl(`/ws/bookings/${id}/`, `?token=${token}`));
      ws.current = socket;

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
          if (payload.type === 'chat_message_received') {
            if (!isChatOpenRef.current) {
              setUnreadChats(prev => prev + 1);
            }
          } else if (payload.booking) {
            setBooking(payload.booking);
            if (['completed', 'waiting_approval', 'repair_completed', 'WAITING_FOR_CASH_CONFIRMATION'].includes(payload.booking.status)) {
              api.get(`/api/billing/${id}/get-bill/`)
                .then(res => setExistingBill(res.data))
                .catch(() => setExistingBill(null));
            }
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = (e) => {
        if (pingInterval) clearInterval(pingInterval);
        ws.current = null;
        if (isActive && e.code !== 4003) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      isActive = false;
      if (pingInterval) clearInterval(pingInterval);
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [id]);

  const updateJobStatus = async (newStatus) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/api/bookings/bookings/${id}/update-status/`, {
        status: newStatus
      });
      setBooking(res.data);
      toast.success(`Job status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyQR = async () => {
    if (!qrCodeInput) {
      toast.error('Please input QR code value');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/api/bookings/bookings/${id}/verify-qr/`, {
        qr_code: qrCodeInput
      });
      setBooking(res.data);
      toast.success('QR Code Check-in Verified successfully!');
      setQrCodeInput('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'QR Code Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelWarningOpen(false);
    try {
      await api.post(`/api/bookings/bookings/${id}/cancel-booking/`);
      toast.success('Service job booking has been cancelled.');
      navigate('/captain/dashboard');
    } catch (err) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleUploadMedia = async () => {
    setUploadingMedia(true);
    const formData = new FormData();
    if (beforePhoto) formData.append('before_photo', beforePhoto);
    if (afterPhoto) formData.append('after_photo', afterPhoto);
    if (sparePartPhoto) formData.append('spare_part_photo', sparePartPhoto);
    if (invoicePhoto) formData.append('invoice_photo', invoicePhoto);
    if (optionalVideo) formData.append('optional_video', optionalVideo);

    try {
      await api.post(`/api/bookings/bookings/${id}/upload-media/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Diagnostic inspection media uploaded successfully!');
      setBeforePhoto(null);
      setAfterPhoto(null);
      setSparePartPhoto(null);
      setInvoicePhoto(null);
      setOptionalVideo(null);
    } catch (e) {
      toast.error('Failed to upload media files');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUpdateWorkshopToken = async () => {
    setUpdatingToken(true);
    try {
      const res = await api.post(`/api/bookings/bookings/${id}/update-workshop-token/`, {
        status: workshopStatus
      });
      setBooking(res.data);
      toast.success('Workshop repair progress token updated.');
    } catch (err) {
      toast.error('Failed to update workshop status');
    } finally {
      setUpdatingToken(false);
    }
  };

  const handleRequestMajorRepair = async () => {
    setRequestingRepair(true);
    try {
      const res = await api.post(`/api/bookings/bookings/${id}/request-major-repair/`, {
        reason: repairReason,
        estimated_cost: repairCost
      });
      setBooking(res.data);
      toast.success('Cost authorization request sent to customer.');
      setRepairReason('');
      setRepairCost('');
    } catch (err) {
      toast.error('Failed to send request');
    } finally {
      setRequestingRepair(false);
    }
  };

  const handlePartChange = (index, field, value) => {
    const list = [...spareParts];
    list[index][field] = value;
    setSpareParts(list);
  };

  const handleAddPart = () => {
    setSpareParts([...spareParts, { part_name: '', quantity: 1, price: '' }]);
  };

  const handleRemovePart = (index) => {
    const list = [...spareParts];
    list.splice(index, 1);
    setSpareParts(list);
  };

  const handleGenerateBill = async () => {
    setGeneratingBill(true);
    const data = {
      labour_charges: labourCharges,
      discount: discount || '0.00',
      parts_used: spareParts.filter(p => p.part_name && p.price)
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (supplierInvoice) {
      formData.append('supplier_invoice', supplierInvoice);
    }

    try {
      const res = await api.post(`/api/billing/${id}/generate-bill/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setExistingBill(res.data);
      toast.success('Service Invoice generated and sent to customer.');
      fetchJobDetails();
    } catch (err) {
      toast.error('Invoice compilation failed');
    } finally {
      setGeneratingBill(false);
    }
  };

  const handleConfirmCashReceived = async () => {
    setConfirmingCash(true);
    try {
      await api.post(`/api/billing/${id}/confirm-cash-payment/`);
      toast.success('Cash payment confirmed successfully.');
      setConfirmCashDialogOpen(false);
      fetchJobDetails();
    } catch (err) {
      toast.error('Failed to confirm cash payment.');
    } finally {
      setConfirmingCash(false);
    }
  };


  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/api/billing/${id}/download-invoice/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!booking) {
    return (
      <DashboardPage title="Job Workspace" description="Job details not found.">
        <Typography variant="body1">This service job details does not exist.</Typography>
      </DashboardPage>
    );
  }

  const activeStepIdx = getActiveStepIndex(booking.status);

  const summary = (
    <SummaryGrid columns={4}>
      <SummaryCard
        label="Customer Contact"
        value={booking.customer?.full_name || 'Loading...'}
        icon={<CheckCircleIcon />}
        accentColor="#1A73E8"
        loading={loading}
      />
      <SummaryCard
        label="Booked Time"
        value={booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
        icon={<HourglassEmptyIcon />}
        accentColor="#FBBC05"
        loading={loading}
      />
      <SummaryCard
        label="Service Type"
        value={booking.service_category_detail?.name || 'N/A'}
        icon={<HandymanIcon />}
        accentColor="#8F00FF"
        loading={loading}
      />
      <SummaryCard
        label="Base charges"
        value={`₹${booking.service_category_detail?.base_labour_charge || '0.00'}`}
        icon={<PlayArrowIcon />}
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
        { label: 'Job Details' }
      ]}
      title={`Job Booking #${booking.id}`}
      description={`Service: ${booking.service_category_detail?.name} (${booking.problem_type})`}
      summary={summary}
      actions={
        <Box display="flex" gap={1.5}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/captain/dashboard')}
            sx={{ color: tokens.colors.primary, textTransform: 'none', fontWeight: 700 }}
          >
            Back to Board
          </Button>

          {['accepted', 'on_the_way', 'arrived'].includes(booking.status) && (
            <Button 
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />} 
              onClick={() => setCancelWarningOpen(true)}
              sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
            >
              Cancel Job
            </Button>
          )}
        </Box>
      }
    >
      <DashboardGrid>
        {/* Left column: Stepper progress, actions milestones, billing builder, media uploads */}
        <Box sx={span.twoThirds}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Timeline Stepper */}
            <DashboardCard title="Service Timeline Checkpoints" subtitle="Track check-in, execution, and invoice completion">
              <Box sx={{ mt: 2 }}>
                <Stepper 
                  activeStep={activeStepIdx >= 0 ? activeStepIdx : 0} 
                  orientation={typeof window !== 'undefined' && window.innerWidth < 600 ? 'vertical' : 'horizontal'} 
                  alternativeLabel={typeof window !== 'undefined' && window.innerWidth >= 600}
                >
                  {JOB_TIMELINE.map((step) => (
                    <Step key={step.key}>
                      <StepLabel
                        StepIconProps={{
                          sx: {
                            color: activeStepIdx >= JOB_TIMELINE.findIndex(s => s.key === step.key) ? tokens.colors.accent : tokens.borderColor,
                            '&.Mui-active': { color: tokens.colors.accent },
                            '&.Mui-completed': { color: tokens.colors.accent }
                          }
                        }}
                      >
                        <Typography variant="caption" fontWeight={600}>
                          {step.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </DashboardCard>

            {/* Execute Milestones Card */}
            <DashboardCard title="Execute Service Milestones" subtitle="Update booking status as you perform operations">
              <Box sx={{ mt: 1 }}>
                {booking.status === 'accepted' && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => updateJobStatus('on_the_way')}
                    disabled={submitting}
                    sx={{ bgcolor: tokens.colors.accent, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Start Navigation
                  </Button>
                )}

                {booking.status === 'on_the_way' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => updateJobStatus('arrived')}
                    disabled={submitting}
                    sx={{ bgcolor: tokens.colors.accent, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Arrived
                  </Button>
                )}

                {booking.status === 'arrived' && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Scan or enter the verification check-in QR token generated on the Customer's app to unlock the service:
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs>
                        <TextField
                          fullWidth
                          label="Enter Customer QR Value"
                          placeholder="e.g. 8-digit code"
                          value={qrCodeInput}
                          onChange={(e) => setQrCodeInput(e.target.value)}
                        />
                      </Grid>
                      <Grid item>
                        <Button
                          variant="contained"
                          onClick={handleVerifyQR}
                          disabled={submitting}
                          startIcon={<QrCodeScannerIcon />}
                          sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', py: 2, px: 3, borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
                        >
                          Check-in (Verify QR)
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {booking.status === 'verified' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => updateJobStatus('repair_started')}
                    disabled={submitting}
                    sx={{ bgcolor: tokens.colors.accent, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Start Work
                  </Button>
                )}

                {booking.status === 'inspection' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => updateJobStatus('repair_started')}
                    disabled={submitting}
                    sx={{ bgcolor: tokens.colors.accent, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Start Work
                  </Button>
                )}

                {booking.status === 'repair_started' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => updateJobStatus('repair_completed')}
                    disabled={submitting}
                    sx={{ bgcolor: tokens.colors.accent, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Complete Work
                  </Button>
                )}

                {booking.status === 'repair_completed' && !existingBill && (
                  <Typography variant="body2" color="warning.main" fontWeight="700">
                    Work complete. Please fill out parts & labour fee below to compile the invoice and seek payment.
                  </Typography>
                )}

                {booking.status === 'waiting_approval' && (
                  <Typography variant="body2" color="info.main" fontWeight="700" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} /> Invoice generated. Awaiting customer confirmation/payout.
                  </Typography>
                )}

                {booking.status === 'WAITING_FOR_CASH_CONFIRMATION' && (
                  <Box display="flex" flexDirection="column" gap={2} sx={{ width: '100%' }}>
                    <Typography variant="body2" color="warning.main" fontWeight="700" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ mr: 1 }} /> Cash Payment Pending from Customer (₹{existingBill?.grand_total || 'N/A'}).
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setConfirmCashDialogOpen(true)}
                      disabled={confirmingCash}
                      sx={{ bgcolor: tokens.colors.success || '#16A34A', color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700, '&:hover': { bgcolor: '#15803d' } }}
                    >
                      Confirm Cash Received
                    </Button>
                  </Box>
                )}

                {booking.status === 'ready_to_complete' && (
                  <Box display="flex" flexDirection="column" gap={2} sx={{ width: '100%' }}>
                    <Box sx={{ p: 2, bgcolor: 'rgba(22,163,74,0.08)', borderRadius: '12px', border: '1px solid rgba(22,163,74,0.2)' }}>
                      <Typography variant="subtitle2" fontWeight={800} color="success.main" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} /> Online Payment Received (₹{existingBill?.grand_total || 'N/A'})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The customer has completed payment. Please check/verify the payment received and click below to finish the job and credit earnings to your wallet.
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => updateJobStatus('completed')}
                      disabled={submitting}
                      startIcon={<CheckCircleIcon />}
                      sx={{ bgcolor: '#16A34A', color: '#ffffff', py: 1.75, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 800, fontSize: '0.95rem', '&:hover': { bgcolor: '#15803d' } }}
                    >
                      Verify Payment Received & Complete Job
                    </Button>
                  </Box>
                )}

                {booking.status === 'completed' && (
                  <Typography variant="body1" fontWeight={700} color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} /> Job runs verified & completed successfully. Payout confirmed.
                  </Typography>
                )}
              </Box>
            </DashboardCard>

            {/* Invoicing Billing Builder */}
            {booking.status === 'repair_completed' && !existingBill && (
              <DashboardCard title="Compile Service Invoice Bill" subtitle="Log labor charges, promo discount, and spare parts used">
                <Box sx={{ mt: 1 }}>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Labour / Service Charges (₹)"
                        type="number"
                        value={labourCharges}
                        onChange={(e) => setLabourCharges(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Discount amount if any (₹)"
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Spare Parts Used Details
                  </Typography>

                  {spareParts.map((part, index) => (
                    <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={7}>
                        <TextField
                          fullWidth
                          label="Part Description Name"
                          value={part.part_name}
                          onChange={(e) => handlePartChange(index, 'part_name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={2}>
                        <TextField
                          fullWidth
                          label="Qty"
                          type="number"
                          value={part.quantity}
                          onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={2}>
                        <TextField
                          fullWidth
                          label="Price (₹)"
                          type="number"
                          value={part.price}
                          onChange={(e) => handlePartChange(index, 'price', e.target.value)}
                        />
                      </Grid>
                      {spareParts.length > 1 && (
                        <Grid item xs={12} sm={1}>
                          <IconButton color="error" onClick={() => handleRemovePart(index)}>
                            <RemoveCircleOutlinedIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  ))}

                  <Button
                    startIcon={<AddCircleOutlinedIcon />}
                    onClick={handleAddPart}
                    sx={{ color: tokens.colors.accent, mb: 3, textTransform: 'none', fontWeight: '700' }}
                  >
                    Add Another Spare Part
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                    OR Upload Supplier Invoice Copy (Image/PDF)
                  </Typography>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, mb: 3 }}>
                    Select Supplier Invoice File
                    <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => setSupplierInvoice(e.target.files[0])} />
                  </Button>
                  {supplierInvoice && <Typography variant="caption" color="success.main" display="block" sx={{ mb: 3 }}>{supplierInvoice.name}</Typography>}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGenerateBill}
                    disabled={generatingBill}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    {generatingBill ? 'Compiling Invoices...' : 'Generate & Submit Invoice'}
                  </Button>
                </Box>
              </DashboardCard>
            )}

            {/* Bill Summary Preview Card */}
            {existingBill && (
              <DashboardCard title="Service Invoice Preview" subtitle={`Status: ${existingBill.is_approved ? 'APPROVED & PAID' : 'AWAITING CUSTOMER CONFIRMATION'}`}>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 2, fontFamily: 'Outfit, sans-serif' }}>
                    Grand Total Invoice: ₹{existingBill.grand_total}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleDownloadInvoice}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    Download Official Invoice PDF
                  </Button>
                </Box>
              </DashboardCard>
            )}

            {/* Diagnostic Media Documentation Upload */}
            {['inspection', 'repair_started', 'repair_completed'].includes(booking.status) && (
              <DashboardCard title="Service Media Documentation" subtitle="Upload stage proofs for safety and transparency checks">
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>Before Repair Photo</Typography>
                      <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px` }}>
                        Upload Before Photo
                        <input type="file" hidden accept="image/*" onChange={(e) => setBeforePhoto(e.target.files[0])} />
                      </Button>
                      {beforePhoto && <Typography variant="caption" color="success.main" display="block">{beforePhoto.name}</Typography>}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>After Repair Photo</Typography>
                      <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px` }}>
                        Upload After Photo
                        <input type="file" hidden accept="image/*" onChange={(e) => setAfterPhoto(e.target.files[0])} />
                      </Button>
                      {afterPhoto && <Typography variant="caption" color="success.main" display="block">{afterPhoto.name}</Typography>}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>Spare Part Photo</Typography>
                      <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px` }}>
                        Upload Parts Photo
                        <input type="file" hidden accept="image/*" onChange={(e) => setSparePartPhoto(e.target.files[0])} />
                      </Button>
                      {sparePartPhoto && <Typography variant="caption" color="success.main" display="block">{sparePartPhoto.name}</Typography>}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>Supplier Invoice Copy</Typography>
                      <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px` }}>
                        Upload Invoice Image
                        <input type="file" hidden accept="image/*" onChange={(e) => setInvoicePhoto(e.target.files[0])} />
                      </Button>
                      {invoicePhoto && <Typography variant="caption" color="success.main" display="block">{invoicePhoto.name}</Typography>}
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>Optional Video (MP4/MOV)</Typography>
                      <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px` }}>
                        Upload Diagnostic Video
                        <input type="file" hidden accept="video/*" onChange={(e) => setOptionalVideo(e.target.files[0])} />
                      </Button>
                      {optionalVideo && <Typography variant="caption" color="success.main" display="block">{optionalVideo.name}</Typography>}
                    </Grid>
                  </Grid>

                  <Button
                    variant="contained"
                    onClick={handleUploadMedia}
                    disabled={uploadingMedia || (!beforePhoto && !afterPhoto && !sparePartPhoto && !invoicePhoto && !optionalVideo)}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', px: 4, py: 1.25, borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    {uploadingMedia ? 'Uploading Files...' : 'Submit Media Documentation'}
                  </Button>
                </Box>
              </DashboardCard>
            )}
          </Box>
        </Box>

        {/* Right column: Customer Contact Details, Workshop Tokens, Major repair requests */}
        <Box sx={span.oneThird}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* Customer Details Contact Card */}
            <DashboardCard title="Customer Contact Details" subtitle="Contact coordinates for customer location">
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {booking.customer?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Phone: <b>{booking.customer?.phone}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Address: <b>{booking.address}, {booking.city}, {booking.state} - {booking.pincode}</b>
                </Typography>

                <Box display="flex" gap={2} sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => window.open(`tel:${booking.customer?.phone}`)}
                    sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Call
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(booking.address)}`)}
                    sx={{ borderColor: tokens.colors.primary, color: tokens.colors.primary, textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                  >
                    Navigate
                  </Button>
                </Box>
                {booking && booking.worker && !['searching', 'pending', 'cancelled'].includes(booking.status) && (
                  <Badge badgeContent={unreadChats} color="error" sx={{ width: '100%', mt: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        setIsChatOpen(true);
                        setUnreadChats(0);
                      }}
                      sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', textTransform: 'none', borderRadius: `${tokens.borderRadiusSm}px`, fontWeight: 700 }}
                    >
                      Chat with Customer
                    </Button>
                  </Badge>
                )}
              </Box>
            </DashboardCard>

            {/* Problem Description Callout */}
            <DashboardCard title="Problem Statement" subtitle="Original customer ticket details">
              <Box sx={{ p: 2, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px` }}>
                <Typography variant="body2" fontWeight="700">
                  {booking.problem_description || 'No detailed explanation provided.'}
                </Typography>
              </Box>
            </DashboardCard>

            {/* Workshop Repair Token Allocation */}
            {['inspection', 'repair_started', 'repair_completed'].includes(booking.status) && (
              <DashboardCard title="Workshop Token" subtitle="Off-site item repair tracker details">
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label="Workshop Milestone"
                    value={workshopStatus}
                    onChange={(e) => setWorkshopStatus(e.target.value)}
                  >
                    <MenuItem value="item_received">Item Received</MenuItem>
                    <MenuItem value="reached_workshop">Reached Workshop</MenuItem>
                    <MenuItem value="inspection">Inspection Milestone</MenuItem>
                    <MenuItem value="waiting_parts">Waiting For Spare Parts</MenuItem>
                    <MenuItem value="repair_started">Repair Process Initiated</MenuItem>
                    <MenuItem value="repair_completed">Workshop Repair Completed</MenuItem>
                    <MenuItem value="returning">Item Returning</MenuItem>
                    <MenuItem value="delivered">Item Delivered</MenuItem>
                  </TextField>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUpdateWorkshopToken}
                    disabled={updatingToken}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    {updatingToken ? 'Updating...' : 'Update Workshop Token'}
                  </Button>

                  {booking.repair_token && (
                    <Box sx={{ p: 2, bgcolor: tokens.colors.accentLight, borderRadius: `${tokens.borderRadiusSm}px`, border: '1px solid rgba(26, 115, 232, 0.15)' }}>
                      <Typography variant="caption" color="text.secondary">Active Token ID:</Typography>
                      <Typography variant="body2" fontWeight={700}>{booking.repair_token.token_number}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Milestone:</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', color: tokens.colors.accent }}>
                        {booking.repair_token.status.replace('_', ' ')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DashboardCard>
            )}

            {/* Major Repair Cost Estimate Authorization Requests */}
            {['inspection', 'repair_started'].includes(booking.status) && (
              <DashboardCard title="Major Cost Approvals" subtitle="Request cost authorizations for extensive damage">
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Description of extra parts"
                    placeholder="e.g. Compressor replaced"
                    value={repairReason}
                    onChange={(e) => setRepairReason(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Estimated Cost (₹)"
                    type="number"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    onClick={handleRequestMajorRepair}
                    disabled={requestingRepair || !repairReason || !repairCost}
                    sx={{ bgcolor: tokens.colors.primary, color: '#ffffff', py: 1.5, borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#23232F' } }}
                  >
                    Send Authorization Request
                  </Button>

                  {booking.major_repairs && booking.major_repairs.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Submitted Estimates Log:</Typography>
                      <List disablePadding sx={{ mt: 1 }}>
                        {booking.major_repairs.map((rep) => (
                          <ListItem key={rep.id} sx={{ px: 0, py: 1 }} divider>
                            <ListItemText primary={rep.reason} secondary={`Estimate: ₹${rep.estimated_cost}`} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
                            <Box sx={{ 
                              px: 1, py: 0.25, borderRadius: '4px',
                              bgcolor: rep.status === 'approved' ? 'rgba(22, 163, 74, 0.08)' : rep.status === 'rejected' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                              border: rep.status === 'approved' ? '1px solid rgba(22, 163, 74, 0.15)' : rep.status === 'rejected' ? '1px solid rgba(220, 38, 38, 0.15)' : '1px solid rgba(217, 119, 6, 0.15)'
                            }}>
                              <Typography variant="caption" fontWeight={700} color={rep.status === 'approved' ? 'success.main' : rep.status === 'rejected' ? 'error.main' : 'warning.main'}>
                                {rep.status.toUpperCase()}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              </DashboardCard>
            )}
          </Box>
        </Box>
      </DashboardGrid>

      {/* Cancel Warning Modal */}
      <Dialog 
        open={cancelWarningOpen} 
        onClose={() => setCancelWarningOpen(false)}
        PaperProps={{ style: { borderRadius: `${tokens.borderRadius}px` } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
          ⚠️ Cancel Job Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? Cancelling after accepting may affect your performance and reduce your overall completion rates.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelWarningOpen(false)} sx={{ color: tokens.colors.primary }}>
            Keep Booking
          </Button>
          <Button onClick={handleCancelBooking} color="error" variant="contained" sx={{ borderRadius: `${tokens.borderRadiusSm}px` }}>
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Cash Received Dialog */}
      <Dialog
        open={confirmCashDialogOpen}
        onClose={() => !confirmingCash && setConfirmCashDialogOpen(false)}
        PaperProps={{ style: { borderRadius: `${tokens.borderRadius}px`, padding: '8px' } }}
      >
        <DialogTitle sx={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
          Confirm Cash Payment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Have you received the complete payment from the customer?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCashDialogOpen(false)} disabled={confirmingCash} sx={{ color: tokens.colors.primary, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmCashReceived} 
            color="success" 
            variant="contained" 
            disabled={confirmingCash}
            sx={{ borderRadius: `${tokens.borderRadiusSm}px`, textTransform: 'none', fontWeight: 700 }}
          >
            {confirmingCash ? <CircularProgress size={20} color="inherit" /> : 'Yes, Received'}
          </Button>
        </DialogActions>
      </Dialog>
      <ChatWindow
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        bookingId={id}
        currentUser={JSON.parse(localStorage.getItem('user'))}
        otherUser={booking?.customer}
      />
    </DashboardPage>
  );
}

export default WorkerJobDetails;
