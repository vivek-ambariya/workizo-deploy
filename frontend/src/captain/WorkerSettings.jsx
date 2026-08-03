import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Divider, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import ShieldIcon from '@mui/icons-material/Shield';
import toast from 'react-hot-toast';

import { tokens, span } from '../design/tokens';
import { 
  DashboardPage, DashboardGrid, DashboardCard 
} from '../components/dashboard';

function WorkerSettings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Preferences saved successfully!');
  };

  return (
    <DashboardPage
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/captain/dashboard' },
        { label: 'Settings' }
      ]}
      title="System Settings & Support"
      description="Configure system configurations, notification channels, or consult policies."
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
        {/* Left Column: Preferences and Policies */}
        <Box sx={span.twoThirds}>
          <Box display="flex" flexDirection="column" gap={3}>
            
            {/* General Preferences */}
            <DashboardCard title="General Preferences" subtitle="Manage interface settings and notifications">
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications} 
                          onChange={(e) => setNotifications(e.target.checked)} 
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: tokens.colors.accent,
                              '& + .MuiSwitch-track': {
                                backgroundColor: tokens.colors.accent,
                                opacity: 0.9,
                              },
                            },
                          }}
                        />
                      }
                      label="Receive Sound Notifications (audio alerts for incoming jobs)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={darkMode} 
                          onChange={(e) => setDarkMode(e.target.checked)} 
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: tokens.colors.accent,
                              '& + .MuiSwitch-track': {
                                backgroundColor: tokens.colors.accent,
                                opacity: 0.9,
                              },
                            },
                          }}
                        />
                      }
                      label="Mock Dark Mode Theme"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Application Language</InputLabel>
                      <Select
                        value={language}
                        label="Application Language"
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <MenuItem value="en">English (US)</MenuItem>
                        <MenuItem value="es">Español</MenuItem>
                        <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
                        <MenuItem value="gu">ગુજરાતી (Gujarati)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  onClick={handleSaveSettings}
                  sx={{ 
                    bgcolor: tokens.colors.primary, 
                    color: '#ffffff', 
                    mt: 4, 
                    px: 4, 
                    py: 1.25,
                    borderRadius: `${tokens.borderRadiusSm}px`, 
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#23232F' }
                  }}
                >
                  Save Preferences
                </Button>
              </Box>
            </DashboardCard>

            {/* Policies */}
            <DashboardCard title="Privacy & Legal Policies" subtitle="Independent partner legal bounds and terms">
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Terms & Conditions of Service
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 0.5 }}>
                  As a verified WORKIZO service Captain, you are an independent service partner. Agreeing to work bookings requires compliance with regional safety guidelines, providing timely check-ins via QR code verification, and honest invoice submissions. Cancellations made post-acceptance may reduce your acceptance and completion score metrics.
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" fontWeight={600}>
                  Partner Privacy Policy
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  WORKIZO tracks location data exclusively when you toggle your status to ONLINE to search and present bookings matching your service category inside Ahmedabad region. Settlement bank documents, Aadhaar cards, and PAN documents uploaded during registration are stored securely and never shared with third-party networks.
                </Typography>
              </Box>
            </DashboardCard>
          </Box>
        </Box>

        {/* Right Column: Hotline support details */}
        <Box sx={span.oneThird}>
          <DashboardCard title="Help & Support Hotline" subtitle="Direct assistance channels for Captains">
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Got questions or queries regarding service payouts, verification checks, or client disputes? Reach our dedicated Captain assistance team:
              </Typography>
              <Box sx={{ p: 2, bgcolor: tokens.colors.bg, borderRadius: `${tokens.borderRadiusSm}px` }}>
                <Typography variant="body2" fontWeight={600}>
                  Email Support:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  captain-support@workizo.com
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  Phone Assistance:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  +91 79 4004 0404
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Mon-Sat, 9:00 AM to 6:00 PM
                </Typography>
              </Box>
            </Box>
          </DashboardCard>
        </Box>
      </DashboardGrid>
    </DashboardPage>
  );
}

export default WorkerSettings;
