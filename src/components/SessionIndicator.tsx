import { Box, Typography } from '@mui/material'

interface SessionIndicatorProps {
  /** Session number shown in the label ("Session {label} of {total}"). */
  label: number
  /** Number of filled dots. */
  filled: number
  total: number
}

export default function SessionIndicator({
  label,
  filled,
  total,
}: SessionIndicatorProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}
      >
        Session {label} of {total}
      </Typography>
      <Box
        sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}
        aria-hidden
      >
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              bgcolor: i < filled ? 'primary.main' : 'action.selected',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
