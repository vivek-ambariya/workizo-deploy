import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { tokens } from '../../design/tokens';

const SummaryCard = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  accentColor = tokens.colors.accent,
  loading = false,
  onClick,
}) => (
  <Box
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    sx={{
      bgcolor: tokens.colors.paper,
      border: `1px solid ${tokens.borderColor}`,
      borderRadius: `${tokens.borderRadius}px`,
      boxShadow: tokens.shadow,
      p: `${tokens.cardPadding}px`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: tokens.transition,
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': {
        boxShadow: tokens.shadowHover,
        borderColor: onClick ? accentColor : tokens.borderColor,
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <>
            <Skeleton width={100} height={16} sx={{ mb: 1 }} />
            <Skeleton width={80} height={36} />
          </>
        ) : (
          <>
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.textSecondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'block',
                mb: 0.75,
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: tokens.colors.primary,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {value}
            </Typography>
          </>
        )}
      </Box>

      {icon && (
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: `${tokens.borderRadiusSm}px`,
            bgcolor: `${accentColor}14`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
    </Box>

    {(trend || trendLabel) && !loading && (
      <Typography
        variant="caption"
        sx={{
          mt: 1.5,
          color: trend?.startsWith('+') ? tokens.colors.success : tokens.colors.textSecondary,
          fontWeight: 600,
        }}
      >
        {trend} {trendLabel}
      </Typography>
    )}
  </Box>
);

export default SummaryCard;
