import React from 'react';
import { Box, Breadcrumbs, Link, Typography, Skeleton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { tokens } from '../../design/tokens';

const PageHeader = ({ breadcrumbs = [], title, description, actions, loading }) => {
  if (loading) {
    return (
      <Box>
        <Skeleton width={200} height={20} sx={{ mb: 1 }} />
        <Skeleton width={320} height={40} sx={{ mb: 1 }} />
        <Skeleton width={480} height={24} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: tokens.colors.textMuted }} />}
            sx={{ mb: 1.5 }}
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              if (isLast || !crumb.path) {
                return (
                  <Typography
                    key={crumb.label}
                    variant="body2"
                    color={isLast ? 'text.primary' : 'text.secondary'}
                    fontWeight={isLast ? 600 : 400}
                  >
                    {crumb.label}
                  </Typography>
                );
              }
              return (
                <Link
                  key={crumb.label}
                  component={RouterLink}
                  to={crumb.path}
                  underline="hover"
                  color="text.secondary"
                  variant="body2"
                  sx={{ '&:hover': { color: tokens.colors.accent } }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {title && (
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: tokens.colors.primary,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
        )}

        {description && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 720 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {actions && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            flexShrink: 0,
            alignItems: 'center',
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
