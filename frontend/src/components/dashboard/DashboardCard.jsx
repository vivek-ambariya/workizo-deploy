import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { tokens } from '../../design/tokens';

const DashboardCard = ({
  title,
  subtitle,
  action,
  children,
  sx = {},
  noPadding = false,
  loading = false,
  highlight = false,
  ...props
}) => (
  <Box
    sx={{
      bgcolor: tokens.colors.paper,
      border: `1px solid ${highlight ? tokens.colors.accent : tokens.borderColor}`,
      borderRadius: `${tokens.borderRadius}px`,
      boxShadow: tokens.shadow,
      p: noPadding ? 0 : `${tokens.cardPadding}px`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: tokens.transition,
      '&:hover': {
        boxShadow: tokens.shadowHover,
      },
      ...sx,
    }}
    {...props}
  >
    {(title || action) && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: children ? 2 : 0,
          px: noPadding ? `${tokens.cardPadding}px` : 0,
          pt: noPadding ? `${tokens.cardPadding}px` : 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {title && (
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
    )}

    {loading ? (
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
      </Box>
    ) : (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </Box>
    )}
  </Box>
);

export default DashboardCard;
