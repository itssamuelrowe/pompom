import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import Logo from './Logo'

interface WorkspaceToolbarProps {
  /** Main heading shown next to the logo. */
  title: string
  /** Small caption under the title (hidden on very small screens). */
  subtitle?: string
  /**
   * When set, a back button is shown before the logo that links to this route
   * (client-side). Used by secondary screens like analytics.
   */
  backTo?: string
  /** Accessible label and tooltip for the back button. */
  backLabel?: string
  /**
   * Hide the brand logo. Secondary screens that already show a back button
   * (e.g. analytics) read cleaner without the logo competing with the title.
   */
  hideLogo?: boolean
  /** Right-aligned actions (buttons, icon buttons, toggles). */
  children?: ReactNode
}

/**
 * The shared top bar used across every screen. The left cluster is a
 * consistent brand lockup (optional back button, logo, title, subtitle); the
 * right cluster is whatever actions the screen passes as children. Extracted
 * so the timer, analytics and any future screen share one toolbar instead of
 * each rolling their own.
 */
export default function WorkspaceToolbar({
  title,
  subtitle,
  backTo,
  backLabel = 'Back',
  hideLogo = false,
  children,
}: WorkspaceToolbarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, minWidth: 0 }}
        >
          {backTo && (
            <Tooltip title={backLabel} arrow>
              <IconButton
                component={RouterLink}
                to={backTo}
                aria-label={backLabel}
                size="small"
                sx={{ color: 'text.secondary', flexShrink: 0 }}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
            </Tooltip>
          )}
          {!hideLogo && <Logo size={isMobile ? 34 : 40} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              {title}
            </Typography>
            {subtitle && !isMobile && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            flexShrink: 0,
          }}
        >
          {children}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
