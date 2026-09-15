import {
  createTheme,
  alpha,
  lighten,
  darken,
  type Theme,
  type Shadows,
} from '@mui/material/styles'
import { getAccentColor } from './palette'

type Mode = 'light' | 'dark'

// A completely flat design: every elevation level maps to no shadow.
const FLAT_SHADOWS = Array(25).fill('none') as unknown as Shadows

/**
 * Builds an MUI theme driven heavily by the theme object: the selected accent
 * color and light/dark mode flow into palette, typography, shape and component
 * overrides so the whole app restyles from a single source of truth.
 */
export function createAppTheme(mode: Mode, accentId: string): Theme {
  const accent = getAccentColor(accentId)
  const main = mode === 'dark' ? accent.darkMain : accent.main
  const isDark = mode === 'dark'

  const background = {
    default: isDark ? '#121317' : '#f4f1ee',
    paper: isDark ? '#1c1e24' : '#ffffff',
  }

  const text = {
    primary: isDark ? '#f5f5f7' : '#1c1b1f',
    secondary: isDark ? '#a8abb4' : '#6b6673',
  }

  // The app is flat, but floating surfaces (menus, dropdowns, dialogs) need a
  // soft shadow to separate them from the content underneath.
  const menuShadow = isDark
    ? '0 8px 28px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)'
    : '0 8px 28px rgba(17, 12, 8, 0.14), 0 2px 8px rgba(17, 12, 8, 0.08)'

  return createTheme({
    palette: {
      mode,
      primary: {
        main,
        light: lighten(main, 0.18),
        dark: darken(main, 0.2),
        contrastText: '#ffffff',
      },
      background,
      text,
      divider: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
    },
    shape: {
      borderRadius: 14,
    },
    shadows: FLAT_SHADOWS,
    typography: {
      fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
      h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
      h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 20,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      // Floating surfaces get a soft shadow even though the base design is flat.
      MuiMenu: {
        styleOverrides: {
          paper: {
            boxShadow: menuShadow,
            border: `1px solid ${isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.05)}`,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            boxShadow: menuShadow,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            boxShadow: menuShadow,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            boxShadow: menuShadow,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            border: 'none',
            borderRadius: 10,
            paddingInline: 16,
            color: text.secondary,
            '&.Mui-selected': {
              backgroundColor: main,
              color: '#fff',
              '&:hover': {
                backgroundColor: main,
              },
            },
          },
        },
      },
    },
  })
}
