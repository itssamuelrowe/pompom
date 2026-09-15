import { Box, Chip, Typography, useTheme, alpha } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded'

interface TimerDialProps {
  /** 0 to 1, fraction of time remaining */
  progress: number
  timeLabel: string
  statusLabel: string
  /** When true, the dial adopts a softer "resting" treatment for breaks. */
  isBreak?: boolean
  /**
   * When true, the dial sizes to its parent (which must be a `size` container)
   * instead of the viewport — used in the side-by-side desktop layout.
   */
  fitContainer?: boolean
  sx?: SxProps<Theme>
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
  isBreak = false,
  fitContainer = false,
  sx,
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
      sx={[
        {
          position: 'relative',
          // Scale with the smaller of the available width/height so the whole
          // layout fits without scrolling, capped at the design size.
          // `fitContainer` sizes to the parent size-container (desktop
          // side-by-side); otherwise it sizes to the viewport (stacked).
          width: fitContainer
            ? `min(${SIZE}px, 100cqw, 100cqh)`
            : `min(${SIZE}px, 82vw, 46vh)`,
          aspectRatio: '1 / 1',
          display: 'grid',
          placeItems: 'center',
          mx: 'auto',
          // Establish a container so inner text can scale to the dial size.
          containerType: 'inline-size',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
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

        {/* Background track. On breaks it becomes a dotted "resting" ring to
            subtly signal a break without recoloring the whole screen. */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={track}
          strokeWidth={STROKE}
          strokeLinecap={isBreak ? 'round' : 'butt'}
          strokeDasharray={isBreak ? '1 14' : undefined}
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
        {isBreak && (
          <Chip
            icon={<LocalCafeRoundedIcon />}
            label="Break time"
            size="small"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              color: 'primary.main',
              bgcolor: alpha(main, isDark ? 0.2 : 0.12),
              '& .MuiChip-icon': { color: 'primary.main' },
            }}
          />
        )}
        <Typography
          variant="h1"
          sx={{
            // Scale with the dial (container width) so it fits at any size.
            fontSize: 'clamp(2rem, 22cqw, 4.125rem)',
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
          sx={{
            color: 'text.secondary',
            mt: 1,
            fontWeight: 500,
            fontSize: 'clamp(0.8rem, 5cqw, 1rem)',
          }}
        >
          {statusLabel}
        </Typography>
      </Box>
    </Box>
  )
}
