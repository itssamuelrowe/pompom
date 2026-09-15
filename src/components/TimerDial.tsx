import { Box, Typography, useTheme, alpha } from '@mui/material'

interface TimerDialProps {
  /** 0 to 1, fraction of time remaining */
  progress: number
  timeLabel: string
  statusLabel: string
}

const SIZE = 300
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export default function TimerDial({
  progress,
  timeLabel,
  statusLabel,
}: TimerDialProps) {
  const theme = useTheme()
  const main = theme.palette.primary.main
  const light = theme.palette.primary.light ?? main
  const isDark = theme.palette.mode === 'dark'
  const track = alpha(main, isDark ? 0.16 : 0.13)
  const clamped = Math.max(0, Math.min(1, progress))
  const dashOffset = CIRCUMFERENCE * (1 - clamped)

  return (
    <Box
      sx={{
        position: 'relative',
        width: SIZE,
        maxWidth: '82vw',
        aspectRatio: '1 / 1',
        display: 'grid',
        placeItems: 'center',
        mx: 'auto',
      }}
      role="timer"
      aria-live="polite"
      aria-label={`${statusLabel}, ${timeLabel} remaining`}
    >
      <Box
        component="svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
        }}
      >
        <defs>
          <linearGradient id="pompom-arc" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={main} />
            <stop offset="100%" stopColor={light} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={track}
          strokeWidth={STROKE}
        />

        {/* Progress arc */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="url(#pompom-arc)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.4s linear' }}
        />
      </Box>

      <Box sx={{ textAlign: 'center', px: 2 }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: 54, sm: 66 },
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          {timeLabel}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mt: 1, fontWeight: 500 }}
        >
          {statusLabel}
        </Typography>
      </Box>
    </Box>
  )
}
