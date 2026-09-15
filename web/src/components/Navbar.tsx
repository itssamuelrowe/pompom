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
import GitHubIcon from '@mui/icons-material/GitHub'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Tooltip } from '@mui/material'
import Logo from './Logo'

const REPO_URL = 'https://github.com/itssamuelrowe/pompom'

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
        // Sits flush on the page background; a bottom border separates it.
        bgcolor: 'background.default',
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {isMobile ? (
            <Tooltip title="Star on GitHub" arrow>
              <IconButton
                component="a"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="Star PomPom on GitHub"
                sx={{ color: 'text.secondary' }}
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Enjoying PomPom? Star it on GitHub" arrow>
              <Button
                component="a"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                startIcon={<GitHubIcon />}
                endIcon={<StarRoundedIcon sx={{ color: 'warning.main' }} />}
                aria-label="Star PomPom on GitHub"
                sx={{ color: 'text.secondary' }}
              >
                Star
              </Button>
            </Tooltip>
          )}

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
        </Box>
      </Toolbar>
    </AppBar>
  )
}
