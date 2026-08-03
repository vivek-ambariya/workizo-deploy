/** WORKIZO Design System Tokens */
export const tokens = {
  maxWidth: 1600,
  pagePadding: 32,
  cardPadding: 24,
  cardGap: 24,
  sectionGap: 32,
  borderRadius: 12,
  borderRadiusSm: 8,
  borderColor: '#E5E7EB',
  shadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
  shadowHover: '0 4px 6px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.08)',
  colors: {
    primary: '#0F0F14',
    accent: '#1A73E8',
    accentLight: '#E8F1FD',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    bg: '#F4F6F9',
    paper: '#FFFFFF',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  },
  grid: {
    columns: { xs: 1, sm: 6, lg: 12 },
    gap: 24,
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const span = {
  full: { gridColumn: { xs: '1 / -1' } },
  half: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 6' } },
  third: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 4' } },
  quarter: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 3' } },
  twoThirds: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 8' } },
  oneThird: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 4' } },
  threeQuarters: { gridColumn: { xs: '1 / -1', sm: 'span 6', lg: 'span 9' } },
  oneQuarter: { gridColumn: { xs: '1 / -1', sm: 'span 3', lg: 'span 3' } },
};
