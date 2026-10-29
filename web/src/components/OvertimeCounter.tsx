import { Box, Button, Typography, alpha, useTheme } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import { formatElapsed } from '../utils'
import { MODE_LABELS, type TimerMode } from '../types'

interface OvertimeCounterProps {
  /** Seconds elapsed since the session completed. */
  seconds: number
  /** The mode that just finished and is now being overrun. */
  mode: TimerMode
  /** Dismiss the counter (e.g. the user just landed / stopped working). */
  onDismiss: () => void
}

/**
 * A floating card pinned to the bottom corner showing how long the user has
 * run over their last session. It keeps counting until the next session
 * starts or the user dismisses it. The design uses a warm accent, a live
 * pulsing indicator and a clear dismiss affordance.
 */
export default function OvertimeCounter({
  seconds,
  mode,
  onDismiss,
}: OvertimeCounterProps) {
  const theme = useTheme()
  const warn = theme.palette.warning.main

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={`Overtime after ${MODE_LABELS[mode]}: ${formatElapsed(seconds)}`}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        zIndex: (t) => t.zIndex.snackbar,
        width: 'min(300px, calc(100vw - 32px))',
        p: 1.75,
        borderRadius: 3,
        border: 1,
        borderColor: alpha(warn, 0.35),
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.22)}`,
        // A soft warm wash at the top edge to signal "running over".
        backgroundImage: `linear-gradient(135deg, ${alpha(warn, 0.14)}, transparent 60%)`,
        overflow: 'hidden',
        '@keyframes pompom-overtime-in': {
          from: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        animation: 'pompom-overtime-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {/* Live pulsing indicator. */}
        <Box
          sx={{
            position: 'relative',
            flexShrink: 0,
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            color: warn,
            bgcolor: alpha(warn, 0.14),
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px solid ${alpha(warn, 0.5)}`,
              '@keyframes pompom-overtime-ping': {
                '0%': { transform: 'scale(1)', opacity: 0.7 },
                '100%': { transform: 'scale(1.6)', opacity: 0 },
              },
              animation: 'pompom-overtime-ping 1.6s ease-out infinite',
            },
          }}
        >
          <BoltRoundedIcon fontSize="small" />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              lineHeight: 1,
              letterSpacing: 1,
              fontWeight: 700,
              color: 'warning.main',
            }}
          >
            Overtime
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 26,
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {formatElapsed(seconds)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', lineHeight: 1 }}
          >
            past your {MODE_LABELS[mode].toLowerCase()}
          </Typography>
        </Box>
      </Box>

      <Button
        onClick={onDismiss}
        size="small"
        fullWidth
        startIcon={<CloseRoundedIcon fontSize="small" />}
        sx={{
          mt: 1.25,
          color: 'text.secondary',
          bgcolor: 'action.hover',
          borderRadius: 1.5,
          textTransform: 'none',
          '&:hover': { bgcolor: 'action.selected' },
        }}
      >
        Dismiss
      </Button>
    </Box>
  )
}
