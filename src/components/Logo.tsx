import { Box, useTheme } from '@mui/material'

interface LogoProps {
  size?: number
}

/**
 * PomPom mark: a stylized tomato whose body doubles as a clock face, tying the
 * fruit metaphor to the timer. Uses the theme accent so it recolors with the
 * selected palette.
 */
export default function Logo({ size = 40 }: LogoProps) {
  const theme = useTheme()
  const accent = theme.palette.primary.main
  const isDark = theme.palette.mode === 'dark'
  const leaf = isDark ? '#4ade80' : '#3aa856'
  const leafDark = isDark ? '#22c55e' : '#2f8f4a'
  const gradId = 'pompom-body'
  const highlight = 'rgba(255,255,255,0.9)'

  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="PomPom logo"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={theme.palette.primary.light ?? accent} />
          <stop offset="55%" stopColor={accent} />
          <stop
            offset="100%"
            stopColor={theme.palette.primary.dark ?? accent}
          />
        </radialGradient>
      </defs>

      {/* Tomato body */}
      <path
        d="M32 20
           C16 20 9 31 9 42
           C9 54 20 61 32 61
           C44 61 55 54 55 42
           C55 31 48 20 32 20 Z"
        fill={`url(#${gradId})`}
      />

      {/* Soft top highlight */}
      <ellipse cx="24" cy="33" rx="8" ry="5" fill={highlight} opacity="0.35" />

      {/* Clock face ring */}
      <circle
        cx="32"
        cy="42"
        r="13"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
      />
      {/* Clock hands pointing to a "focus" o'clock */}
      <line
        x1="32"
        y1="42"
        x2="32"
        y2="33"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="42"
        x2="39"
        y2="45"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="42" r="2.2" fill="#fff" />

      {/* Leafy calyx */}
      <g stroke={leafDark} strokeWidth="1" strokeLinejoin="round">
        <path
          d="M32 22 L27 12 L31 15 L32 6 L33 15 L37 12 Z"
          fill={leaf}
        />
        <path d="M32 22 L23 17 L26 20 Z" fill={leaf} />
        <path d="M32 22 L41 17 L38 20 Z" fill={leaf} />
      </g>
      <path
        d="M32 8 C33 12 33 16 32 21"
        fill="none"
        stroke={leafDark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Box>
  )
}
