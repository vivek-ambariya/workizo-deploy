import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { tokens } from '../../design/tokens';

const AuthPageShell = ({ title, subtitle, children, maxWidth = 440 }) => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6,
      px: 2,
      bgcolor: tokens.colors.bg,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth,
        p: { xs: 3, sm: 4 },
        borderRadius: `${tokens.borderRadius}px`,
        border: `1px solid ${tokens.borderColor}`,
        boxShadow: tokens.shadow,
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Workizo"
          sx={{ width: 40, height: 40, mb: 2, objectFit: 'contain' }}
        />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Paper>
  </Box>
);

export default AuthPageShell;
