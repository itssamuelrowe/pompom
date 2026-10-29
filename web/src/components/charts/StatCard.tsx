import type { ReactNode } from 'react'
import { Box, Paper, Typography, alpha, useTheme } from '@mui/material'

interface StatCardProps {
  label: string
  value: string
  caption?: string
  icon?: ReactNode
  /** Accent color for the icon chip; defaults to the theme primary. */
  color?: string
}

/** A compact metric tile used in the analytics summary grid. */
export default function StatCard({
  label,
  value,
  caption,
  icon,
  color,
}: StatCardProps) {
  const theme = useTheme()
  const accent = color ?? theme.palette.primary.main

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              bgcolor: alpha(accent, 0.12),
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          fontSize: { xs: 26, sm: 30 },
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  )
}
