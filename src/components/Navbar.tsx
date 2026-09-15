import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import Logo from './Logo'

interface NavbarProps {
  settingsOpen: boolean
  onToggleSettings: () => void
}

export default function Navbar({ settingsOpen, onToggleSettings }: NavbarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        backdropFilter: 'saturate(180%) blur(8px)',
        bgcolor: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(18,19,23,0.75)'
            : 'rgba(244,241,238,0.75)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Logo size={isMobile ? 34 : 40} />
          <Box>
            <Typography
              variant="h6"
              sx={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}
            >
              PomPom
            </Typography>
            {!isMobile && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Focus on what matters
              </Typography>
            )}
          </Box>
        </Box>

        {isMobile ? (
          <IconButton
            onClick={onToggleSettings}
            color="inherit"
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
            sx={{ color: 'text.secondary' }}
          >
            {settingsOpen ? <CloseRoundedIcon /> : <SettingsRoundedIcon />}
          </IconButton>
        ) : (
          <Button
            onClick={onToggleSettings}
            color="inherit"
            startIcon={
              settingsOpen ? <CloseRoundedIcon /> : <SettingsRoundedIcon />
            }
            sx={{ color: 'text.secondary' }}
          >
            {settingsOpen ? 'Close' : 'Settings'}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  )
}
