import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api, { buildMediaUrl } from '../services/api';
import {
  TextField, Button, Box, CircularProgress, Alert, MenuItem, Typography, Divider, Paper, AppBar, Toolbar, IconButton
} from '@mui/material';
import toast from 'react-hot-toast';
import LogoutIcon from '@mui/icons-material/Logout';

import { tokens, span } from '../design/tokens';
import { 
  DashboardGrid, DashboardCard 
} from '../components/dashboard';

const WorkerOnboarding = () => {
  const { user, updateProfileState, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ocrLoading, setOcrLoading] = useState(false);

  // File Upload State
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [aadhaarPhotoFile, setAadhaarPhotoFile] = useState(null);
  const [panPhotoFile, setPanPhotoFile] = useState(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const [aadhaarData, setAadhaarData] = useState(null);
  const [panData, setPanData] = useState(null);

  const watchFullName = watch('fullName');
  const watchAadhaarNumber = watch('aadhaarNumber');
  const watchPanNumber = watch('panNumber');
  const watchDob = watch('dob');
  const watchFatherName = watch('fatherName');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('services/categories/');
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.full_name,
        phone: user.phone,
        serviceCategoryId: user.profile?.service_category?.id || '',
        experience: user.profile?.experience || 0,
        address: user.profile?.address || '',
        city: user.profile?.city || 'Ahmedabad',
        state: user.profile?.state || 'Gujarat',
        pincode: user.profile?.pincode || '',
        aadhaarNumber: user.profile?.aadhaar_number || '',
        panNumber: user.profile?.pan_number || '',
        bankAccount: user.profile?.bank_account || '',
        ifscCode: user.profile?.ifsc_code || '',
        accountHolderName: user.full_name || '',
        dob: user.profile?.dob || '',
        gender: user.profile?.gender || '',
        fatherName: user.profile?.father_name || '',
      });
    }
  }, [user, reset]);

  const handleDocumentOcr = async (file, expectedType) => {
    if (!file) return;
    
    // Clear previous state for this document type
    if (expectedType === 'AADHAAR') {
      setAadhaarData(null);
      setValue('aadhaarNumber', '');
    } else if (expectedType === 'PAN') {
      setPanData(null);
      setValue('panNumber', '');
    }
    
    setOcrLoading(true);
    const toastId = toast.loading(`Processing ${expectedType === 'AADHAAR' ? 'Aadhaar' : 'PAN'} with OCR...`);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const res = await api.post('ocr/extract-document/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const data = res.data;
      
      // Enforce classification match
      if (data.document_type !== expectedType) {
        const errorMsg = expectedType === 'AADHAAR' 
          ? "Invalid Aadhaar Card. Please upload a clear and valid Aadhaar Card." 
          : "Invalid PAN Card. Please upload a clear and valid PAN Card.";
        throw new Error(errorMsg);
      }
      
      toast.success(`${data.document_type} processed successfully!`, { id: toastId });
      
      if (expectedType === 'AADHAAR') {
        setAadhaarData(data);
        if (data.name) setValue('fullName', data.name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.aadhaar_number) setValue('aadhaarNumber', data.aadhaar_number, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.dob) setValue('dob', data.dob, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.gender) setValue('gender', data.gender.toUpperCase(), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      } else if (expectedType === 'PAN') {
        setPanData(data);
        if (data.name) setValue('fullName', data.name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.pan_number) setValue('panNumber', data.pan_number, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.dob) setValue('dob', data.dob, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        if (data.father_name) setValue('fatherName', data.father_name, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || `Unable to read the document. Please upload a clear ${expectedType === 'AADHAAR' ? 'Aadhaar' : 'PAN'} card.`;
      toast.error(errMsg, { id: toastId });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAadhaarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadhaarPhotoFile(file);
      handleDocumentOcr(file, 'AADHAAR');
    }
  };

  const handlePanChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPanPhotoFile(file);
      handleDocumentOcr(file, 'PAN');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/captain/login');
  };

  const onSubmit = async (data) => {
    // Validate that required files are selected
    if (!profilePhotoFile && !user?.profile?.profile_photo) {
      toast.error('Please upload your profile photo.');
      return;
    }
    if (!aadhaarPhotoFile && !user?.profile?.aadhaar_photo) {
      toast.error('Please upload your Aadhaar card copy.');
      return;
    }
    if (!panPhotoFile && !user?.profile?.pan_photo) {
      toast.error('Please upload your PAN card copy.');
      return;
    }

    // Strict document verification validation checks
    if (aadhaarPhotoFile && !aadhaarData) {
      toast.error("Invalid Aadhaar Card. Please upload a clear and valid Aadhaar Card.");
      return;
    }
    if (panPhotoFile && !panData) {
      toast.error("Invalid PAN Card. Please upload a clear and valid PAN Card.");
      return;
    }

    // Cross-document validation: matching Full Name and Date of Birth
    if (aadhaarData && panData) {
      const normalizeName = (name) => {
        if (!name) return "";
        return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      };
      
      const normalizeDob = (dob) => {
        if (!dob) return "";
        const match = dob.match(/\b\d{4}\b/);
        return match ? match[0] : "";
      };
      
      const nameMatch = normalizeName(aadhaarData.name) === normalizeName(panData.name);
      const dobMatch = normalizeDob(aadhaarData.dob) === normalizeDob(panData.dob);
      
      if (!nameMatch || !dobMatch) {
        toast.error("The details on your Aadhaar Card and PAN Card do not match. Please upload valid documents with matching information.");
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.fullName);
      formData.append('phone', data.phone);
      formData.append('experience', data.experience);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('pincode', data.pincode);
      formData.append('aadhaar_number', data.aadhaarNumber);
      formData.append('pan_number', data.panNumber);
      formData.append('dob', data.dob);
      formData.append('gender', data.gender);
      formData.append('father_name', data.fatherName);
      formData.append('bank_account', data.bankAccount);
      formData.append('ifsc_code', data.ifscCode);
      formData.append('account_holder_name', data.accountHolderName);
      
      if (data.serviceCategoryId) {
        formData.append('service_category_id', data.serviceCategoryId);
      }

      if (profilePhotoFile) formData.append('profile_photo', profilePhotoFile);
      if (aadhaarPhotoFile) formData.append('aadhaar_photo', aadhaarPhotoFile);
      if (panPhotoFile) formData.append('pan_photo', panPhotoFile);

      // Save verification request
      await api.post('workers/register-profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Fetch fresh profile state to sync context
      const fullDetails = await api.get('accounts/me/');
      updateProfileState(fullDetails.data);
      
      toast.success('KYC documents submitted. Status: Pending Verification.');
      navigate('/captain/waiting');
    } catch (err) {
      console.error(err);
      let errorMessage = 'Failed to submit profile documents.';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errors = err.response.data;
          const errorList = Object.keys(errors).map(key => {
            const val = errors[key];
            const msg = Array.isArray(val) ? val.join(', ') : String(val);
            return `${key}: ${msg}`;
          });
          if (errorList.length > 0) {
            errorMessage = errorList.join(' | ');
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.colors.bg, pb: 6 }}>
      {/* Mini Topbar */}
      <AppBar position="static" elevation={0} sx={{ background: '#0F0F14', borderBottom: '1px solid #1E1E24', height: 'auto' }}>
        <Toolbar 
          disableGutters
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1.5,
            px: 4
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
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
            <Box display="flex" flexDirection="column" alignItems="flex-start">
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 900, color: '#ffffff', lineHeight: 1.1, fontSize: '1.25rem', letterSpacing: '.03rem' }}>
                WORKIZO
              </Typography>
              <Typography variant="caption" sx={{ color: '#888888', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.1 }}>
                Captain Portal
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ color: '#ef4444', textTransform: 'none', fontWeight: 700 }}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Container */}
      <Box sx={{ maxWidth: '900px', mx: 'auto', mt: 4, px: 2 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: `${tokens.borderRadius}px`, border: `1px solid ${tokens.borderColor}` }}>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Outfit, sans-serif' }} gutterBottom>
              Captain Onboarding & KYC
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provide government KYC details and settlement bank info once to start receiving bookings.
            </Typography>
          </Box>

          {user?.profile?.approval_status === 'rejected' && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: `${tokens.borderRadiusSm}px` }}>
              Your KYC documents were rejected by the administrator. Please review your details and re-upload clear photos.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <DashboardGrid sx={{ gap: 2.5 }}>
              {/* Personal Details */}
              <Box sx={span.full}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700 }}>
                  Personal Information
                </Typography>
                <Divider />
              </Box>

              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  label="Full Name"
                  InputLabelProps={{ shrink: true }}
                  value={watch('fullName') || ''}
                  {...register('fullName', { required: true })}
                  onChange={(e) => setValue('fullName', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  InputLabelProps={{ shrink: true }}
                  value={watch('phone') || ''}
                  {...register('phone', { required: true })}
                  onChange={(e) => setValue('phone', e.target.value, { shouldValidate: true })}
                />
              </Box>

              {/* Service Category & Experience */}
              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Service Category"
                  InputLabelProps={{ shrink: true }}
                  value={watch('serviceCategoryId') || ''}
                  {...register('serviceCategoryId', { required: true })}
                  onChange={(e) => setValue('serviceCategoryId', e.target.value, { shouldValidate: true })}
                >
                  <MenuItem value="">Select Category</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Years of Experience"
                  InputLabelProps={{ shrink: true }}
                  value={watch('experience') ?? ''}
                  {...register('experience', { required: true })}
                  onChange={(e) => setValue('experience', e.target.value, { shouldValidate: true })}
                />
              </Box>

              {/* Address Details */}
              <Box sx={span.full}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                  Address Details
                </Typography>
                <Divider />
              </Box>

              <Box sx={span.full}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={2}
                  label="Street Address"
                  InputLabelProps={{ shrink: true }}
                  value={watch('address') || ''}
                  {...register('address', { required: true })}
                  onChange={(e) => setValue('address', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="City"
                  InputLabelProps={{ shrink: true }}
                  value={watch('city') || ''}
                  {...register('city', { required: true })}
                  onChange={(e) => setValue('city', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="State"
                  InputLabelProps={{ shrink: true }}
                  value={watch('state') || ''}
                  {...register('state', { required: true })}
                  onChange={(e) => setValue('state', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="Pincode"
                  InputLabelProps={{ shrink: true }}
                  value={watch('pincode') || ''}
                  {...register('pincode', { required: true })}
                  onChange={(e) => setValue('pincode', e.target.value, { shouldValidate: true })}
                />
              </Box>

              {/* Government KYC */}
              <Box sx={span.full}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                  Government Identity KYC
                </Typography>
                <Divider />
              </Box>

              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  label="Aadhaar Card Number (12 digit)"
                  inputProps={{ maxLength: 12 }}
                  InputLabelProps={{ shrink: true }}
                  value={watch('aadhaarNumber') || ''}
                  {...register('aadhaarNumber', { required: true })}
                  onChange={(e) => setValue('aadhaarNumber', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.half}>
                <TextField
                  required
                  fullWidth
                  label="PAN Card Number (10 digit)"
                  inputProps={{ maxLength: 10 }}
                  InputLabelProps={{ shrink: true }}
                  value={watch('panNumber') || ''}
                  {...register('panNumber', { required: true })}
                  onChange={(e) => setValue('panNumber', e.target.value, { shouldValidate: true })}
                />
              </Box>

              <Box sx={span.third}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  InputLabelProps={{ shrink: true }}
                  value={watch('dob') || ''}
                  {...register('dob')}
                  onChange={(e) => setValue('dob', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  InputLabelProps={{ shrink: true }}
                  value={watch('gender') || ''}
                  {...register('gender')}
                  onChange={(e) => setValue('gender', e.target.value, { shouldValidate: true })}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="MALE">MALE</MenuItem>
                  <MenuItem value="FEMALE">FEMALE</MenuItem>
                  <MenuItem value="OTHER">OTHER</MenuItem>
                </TextField>
              </Box>
              <Box sx={span.third}>
                <TextField
                  fullWidth
                  label="Father's Name"
                  InputLabelProps={{ shrink: true }}
                  value={watch('fatherName') || ''}
                  {...register('fatherName')}
                  onChange={(e) => setValue('fatherName', e.target.value, { shouldValidate: true })}
                />
              </Box>

              {/* Bank Details */}
              <Box sx={span.full}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                  Direct Payout Bank Settlement
                </Typography>
                <Divider />
              </Box>

              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="Bank Account Number"
                  InputLabelProps={{ shrink: true }}
                  value={watch('bankAccount') || ''}
                  {...register('bankAccount', { required: true })}
                  onChange={(e) => setValue('bankAccount', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="Bank IFSC Code"
                  InputLabelProps={{ shrink: true }}
                  value={watch('ifscCode') || ''}
                  {...register('ifscCode', { required: true })}
                  onChange={(e) => setValue('ifscCode', e.target.value, { shouldValidate: true })}
                />
              </Box>
              <Box sx={span.third}>
                <TextField
                  required
                  fullWidth
                  label="Account Holder Name"
                  InputLabelProps={{ shrink: true }}
                  value={watch('accountHolderName') || ''}
                  {...register('accountHolderName', { required: true })}
                  onChange={(e) => setValue('accountHolderName', e.target.value, { shouldValidate: true })}
                />
              </Box>

              {/* Upload Documents */}
              <Box sx={span.full}>
                <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
                  Upload Document Photos (Images)
                </Typography>
                <Divider />
              </Box>

              <Box sx={span.third}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Profile Photo *
                </Typography>
                <Button variant="outlined" component="label" fullWidth sx={{ textTransform: 'none', py: 1.25 }}>
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={(e) => setProfilePhotoFile(e.target.files[0])} />
                </Button>
                {profilePhotoFile ? (
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    Selected: {profilePhotoFile.name}
                  </Typography>
                ) : user?.profile?.profile_photo && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Already uploaded.
                  </Typography>
                )}
              </Box>

              <Box sx={span.third}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Aadhaar Card Copy *
                </Typography>
                <Button variant="outlined" component="label" fullWidth disabled={ocrLoading} sx={{ textTransform: 'none', py: 1.25 }}>
                  {ocrLoading ? 'Processing...' : 'Upload Aadhaar'}
                  <input type="file" hidden accept="image/*" onChange={handleAadhaarChange} />
                </Button>
                {aadhaarPhotoFile ? (
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    Selected: {aadhaarPhotoFile.name}
                  </Typography>
                ) : user?.profile?.aadhaar_photo && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Already uploaded.
                  </Typography>
                )}
              </Box>

              <Box sx={span.third}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  PAN Card Copy *
                </Typography>
                <Button variant="outlined" component="label" fullWidth disabled={ocrLoading} sx={{ textTransform: 'none', py: 1.25 }}>
                  {ocrLoading ? 'Processing...' : 'Upload PAN'}
                  <input type="file" hidden accept="image/*" onChange={handlePanChange} />
                </Button>
                {panPhotoFile ? (
                  <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                    Selected: {panPhotoFile.name}
                  </Typography>
                ) : user?.profile?.pan_photo && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Already uploaded.
                  </Typography>
                )}
              </Box>
            </DashboardGrid>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 5, 
                py: 1.5, 
                px: 5, 
                bgcolor: tokens.colors.primary, 
                color: '#ffffff', 
                borderRadius: `${tokens.borderRadiusSm}px`,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#23232F' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Verification Request'}
            </Button>
          </Box>

        </Paper>
      </Box>
    </Box>
  );
};

export default WorkerOnboarding;
