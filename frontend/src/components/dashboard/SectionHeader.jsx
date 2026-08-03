import React from 'react';
import { Box, Typography } from '@mui/material';

const SectionHeader = ({ title, subtitle, action }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 2,
      mb: 2,
    }}
  >
    <Box>
      <Typography variant="h6" fontWeight={600} component="h2">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
  </Box>
);

export default SectionHeader;
