import { Button, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import GitHubIcon from '@mui/icons-material/GitHub'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import WorkspaceToolbar from './WorkspaceToolbar'

const REPO_URL = 'https://github.com/itssamuelrowe/pompom'
const DOCS_URL = `${import.meta.env.BASE_URL}docs/`

interface NavbarProps {
  settingsOpen: boolean
  onToggleSettings: () => void
  /** Open the overtime history popup. */
  onOpenHistory: () => void
  /** Navigate to the analytics page. */
  onOpenAnalytics: () => void
}

/**
 * The timer screen's top bar: the shared WorkspaceToolbar with the timer's
 * actions (analytics, history, docs, star, settings) on the right.
 */
export default function Navbar({
  settingsOpen,
  onToggleSettings,
  onOpenHistory,
  onOpenAnalytics,
}: NavbarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <WorkspaceToolbar title="PomPom" subtitle="Focus on what matters">
      <Tooltip title="Analytics" arrow>
        <IconButton
          onClick={onOpenAnalytics}
          color="inherit"
          aria-label="Open analytics"
          sx={{ color: 'text.secondary' }}
        >
          <InsightsRoundedIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Overtime history" arrow>
        <IconButton
          onClick={onOpenHistory}
          color="inherit"
          aria-label="Open overtime history"
          sx={{ color: 'text.secondary' }}
        >
          <HistoryRoundedIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Documentation" arrow>
        <IconButton
          component="a"
          href={DOCS_URL}
          color="inherit"
          aria-label="Open documentation"
          sx={{ color: 'text.secondary' }}
        >
          <MenuBookRoundedIcon />
        </IconButton>
      </Tooltip>

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
          startIcon={settingsOpen ? <CloseRoundedIcon /> : <SettingsRoundedIcon />}
          sx={{ color: 'text.secondary' }}
        >
          {settingsOpen ? 'Close' : 'Settings'}
        </Button>
      )}
    </WorkspaceToolbar>
  )
}
