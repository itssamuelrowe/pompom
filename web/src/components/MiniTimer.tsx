import { useNavigate } from 'react-router-dom'
import {
  Box,
  IconButton,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded'
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import { useTimerContext } from '../timer/context'
import { MODE_LABELS } from '../types'
import { formatTime } from '../utils'

const RING_SIZE = 46
const STROKE = 4

/**
 * A compact, always-available timer that appears on pages other than the main
 * timer screen. It renders from the shared timer context, so starting, pausing
 * or skipping here controls the exact same session.
 */
export default function MiniTimer() {
  const theme = useTheme()
  const navigate = useNavigate()
  const {
    currentMode,
    status,
    remaining,
    progress,
    isBreak,
    overtimeStart,
    handleStart,
    handlePause,
    handleSkip,
    handleStopRinging,
  } = useTimerContext()

  // The overtime counter also lives in the bottom-right corner. When it is
  // showing, lift the mini timer above it so the two never overlap.
  const overtimeActive = overtimeStart !== null

  const isRunning = status === 'RUNNING'
  const isRinging = status === 'RINGING' || status === 'COMPLETED'
  const accent = isBreak ? theme.palette.info.main : theme.palette.primary.main

  // Progress ring geometry.
  const r = (RING_SIZE - STROKE) / 2
  const circumference = 2 * Math.PI * r
  const dash = circumference * (1 - Math.max(0, Math.min(1, progress)))

  const primaryAction = isRinging
    ? handleStopRinging
    : isRunning
      ? handlePause
      : handleStart

  const PrimaryIcon = isRinging
    ? NotificationsOffRoundedIcon
    : isRunning
      ? PauseRoundedIcon
      : PlayArrowRoundedIcon

  const primaryLabel = isRinging
    ? 'Stop ringing'
    : isRunning
      ? 'Pause'
      : status === 'PAUSED'
        ? 'Resume'
        : 'Start'

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        right: { xs: 12, sm: 24 },
        // Sits in the bottom-right corner; when the overtime counter is open it
        // shares that corner, so we lift the mini timer clear of it.
        bottom: overtimeActive
          ? { xs: 210, sm: 220 }
          : { xs: 12, sm: 24 },
        transition: 'bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: (t) => t.zIndex.snackbar - 1,
        p: 1,
        pr: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderRadius: 999,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: `0 8px 28px ${alpha('#000', theme.palette.mode === 'dark' ? 0.5 : 0.14)}`,
        ...(isRinging && {
          '@keyframes mini-pulse': {
            '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(accent, 0.5)}` },
            '50%': { boxShadow: `0 0 0 6px ${alpha(accent, 0)}` },
          },
          animation: 'mini-pulse 1.3s ease-in-out infinite',
        }),
      }}
    >
      {/* Progress ring with the remaining time inside. */}
      <Box
        sx={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}
      >
        <Box
          component="svg"
          width={RING_SIZE}
          height={RING_SIZE}
          sx={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {formatTime(remaining)}
          </Typography>
        </Box>
      </Box>

      {/* Mode label */}
      <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', lineHeight: 1 }}
        >
          {isRinging ? "Time's up" : MODE_LABELS[currentMode]}
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Tooltip title={primaryLabel} arrow>
          <IconButton
            onClick={primaryAction}
            size="small"
            sx={{
              color: '#fff',
              bgcolor: accent,
              '&:hover': { bgcolor: accent, filter: 'brightness(0.95)' },
            }}
            aria-label={primaryLabel}
          >
            <PrimaryIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {!isRinging && (
          <Tooltip title="Skip" arrow>
            <IconButton
              onClick={handleSkip}
              size="small"
              sx={{ color: 'text.secondary' }}
              aria-label="Skip to next session"
            >
              <SkipNextRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Open timer" arrow>
          <IconButton
            onClick={() => navigate('/')}
            size="small"
            sx={{ color: 'text.secondary' }}
            aria-label="Open the full timer"
          >
            <OpenInFullRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  )
}
