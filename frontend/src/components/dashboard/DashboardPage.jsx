import React from 'react';
import { Box } from '@mui/material';
import { tokens } from '../../design/tokens';
import PageHeader from './PageHeader';

/**
 * Universal page shell — every dashboard page uses this structure.
 * Header → Breadcrumb → Title → Summary → Main → Secondary → Tables
 */
const DashboardPage = ({
  breadcrumbs = [],
  title,
  description,
  actions,
  summary,
  loading,
  children,
  footer,
}) => (
  <Box
    component="section"
    sx={{
      width: '100%',
      maxWidth: tokens.maxWidth,
      mx: 'auto',
      px: { xs: 2, sm: 3, md: `${tokens.pagePadding}px` },
      py: { xs: 3, md: 4 },
      pb: { xs: 4, md: 5 },
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: `${tokens.sectionGap}px`,
    }}
  >
    <PageHeader
      breadcrumbs={breadcrumbs}
      title={title}
      description={description}
      actions={actions}
      loading={loading}
    />

    {summary && (
      <Box component="section" aria-label="Summary metrics">
        {summary}
      </Box>
    )}

    <Box
      component="section"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${tokens.sectionGap}px`,
        flex: 1,
        width: '100%',
      }}
    >
      {children}
    </Box>

    {footer && (
      <Box component="footer" sx={{ mt: 'auto', pt: 2 }}>
        {footer}
      </Box>
    )}
  </Box>
);

export default DashboardPage;
