import { Box, Button, Stack } from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded'
import type { TimerStatus } from '../types'

interface ControlsProps {
  status: TimerStatus
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
  onStopRinging: () => void
}

export default function Controls({
  status,
  onStart,
  onPause,
  onReset,
  onSkip,
  onStopRinging,
}: ControlsProps) {
  const isRunning = status === 'RUNNING'
  const isRinging = status === 'RINGING' || status === 'COMPLETED'

  return (
    <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
      {isRinging ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<NotificationsOffRoundedIcon />}
          onClick={onStopRinging}
          fullWidth
          sx={{
            maxWidth: 340,
            py: 1.5,
            fontSize: 18,
            '@keyframes pompom-glow': {
              '0%, 100%': { opacity: 1, transform: 'scale(1)' },
              '50%': { opacity: 0.85, transform: 'scale(1.02)' },
            },
            animation: 'pompom-glow 1.2s ease-in-out infinite',
          }}
        >
          Stop Ringing
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={isRunning ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
          onClick={isRunning ? onPause : onStart}
          fullWidth
          sx={{ maxWidth: 340, py: 1.5, fontSize: 18 }}
        >
          {isRunning ? 'Pause' : status === 'PAUSED' ? 'Resume' : 'Start'}
        </Button>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RestartAltRoundedIcon />}
          onClick={onReset}
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        >
          Reset
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<SkipNextRoundedIcon />}
          onClick={onSkip}
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        >
          Skip
        </Button>
      </Box>
    </Stack>
  )
}
