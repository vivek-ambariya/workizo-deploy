import { createTheme } from '@mui/material/styles';
import { tokens } from './design/tokens';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.primary,
      light: '#374151',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: tokens.colors.accent,
      light: '#4285F4',
      dark: '#1557B0',
      contrastText: '#ffffff',
    },
    success: { main: tokens.colors.success },
    warning: { main: tokens.colors.warning },
    error: { main: tokens.colors.error },
    background: {
      default: tokens.colors.bg,
      paper: tokens.colors.paper,
    },
    text: {
      primary: tokens.colors.primary,
      secondary: tokens.colors.textSecondary,
      disabled: tokens.colors.textMuted,
    },
    divider: tokens.borderColor,
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: tokens.borderRadiusSm,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.colors.bg,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadiusSm,
          padding: '10px 20px',
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: tokens.colors.primary,
          '&:hover': { backgroundColor: '#222222' },
        },
        outlinedPrimary: {
          borderColor: tokens.borderColor,
          color: tokens.colors.primary,
          '&:hover': {
            borderColor: tokens.colors.primary,
            backgroundColor: 'rgba(15, 15, 20, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.colors.paper,
          borderRadius: tokens.borderRadiusSm,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.colors.textMuted,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.colors.accent,
            borderWidth: 2,
          },
        },
        notchedOutline: { borderColor: tokens.borderColor },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.colors.paper,
          border: `1px solid ${tokens.borderColor}`,
          boxShadow: tokens.shadow,
          borderRadius: tokens.borderRadius,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius,
          border: `1px solid ${tokens.borderColor}`,
          boxShadow: tokens.shadow,
          transition: tokens.transition,
          '&:hover': {
            boxShadow: tokens.shadowHover,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.colors.paper,
          color: tokens.colors.primary,
          borderBottom: `1px solid ${tokens.borderColor}`,
          boxShadow: 'none',
          },
        },
      },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${tokens.borderColor}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: tokens.colors.textSecondary,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;
