import React from 'react';
import { Box } from '@mui/material';
import { tokens } from '../../design/tokens';

/**
 * 12-column responsive CSS Grid
 * Desktop: 12 cols | Tablet: 6 cols | Mobile: 1 col
 */
const DashboardGrid = ({ children, sx = {}, ...props }) => (
  <Box
    sx={{
      display: 'grid',
      width: '100%',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(6, 1fr)',
        lg: 'repeat(12, 1fr)',
      },
      gap: `${tokens.cardGap}px`,
      alignItems: 'stretch',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

export default DashboardGrid;
