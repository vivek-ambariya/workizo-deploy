import React from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from '../../design/tokens';

const EmptyState = ({ icon, title, description, action }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      py: 6,
      px: 3,
      flex: 1,
      minHeight: 200,
    }}
  >
    {icon && (
      <Box sx={{ color: tokens.colors.textMuted, mb: 2, '& svg': { fontSize: 48 } }}>
        {icon}
      </Box>
    )}
    <Typography variant="subtitle1" fontWeight={400} gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: action ? 2 : 0 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

export default EmptyState;
