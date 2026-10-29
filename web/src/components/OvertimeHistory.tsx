import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { formatElapsed } from '../utils'
import { MODE_LABELS, type OvertimeEntry } from '../types'

interface OvertimeHistoryProps {
  entries: OvertimeEntry[]
  onRemove: (id: string) => void
}

/** Human-friendly relative-ish timestamp for a log row. */
function formatWhen(ms: number): string {
  const d = new Date(ms)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

export default function OvertimeHistory({ entries, onRemove }: OvertimeHistoryProps) {
  const theme = useTheme()

  if (entries.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 3,
          px: 2,
          borderRadius: '8px',
          border: 1,
          borderColor: 'divider',
          borderStyle: 'dashed',
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        <HistoryRoundedIcon fontSize="small" />
        <Typography variant="body2">No overtime logged yet</Typography>
        <Typography variant="caption">
          When you work past a timer, it shows up here.
        </Typography>
      </Box>
    )
  }

  const total = entries.reduce((sum, e) => sum + e.seconds, 0)

  return (
    <Stack spacing={1}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {entries.length} {entries.length === 1 ? 'session' : 'sessions'} ·{' '}
        {formatElapsed(total)} total overtime
      </Typography>

      <Stack
        spacing={0.75}
        sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}
      >
        {entries.map((e) => (
          <Box
            key={e.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 1,
              borderRadius: '8px',
              border: 1,
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.warning.main, 0.04),
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'warning.main',
                bgcolor: alpha(theme.palette.warning.main, 0.14),
              }}
            >
              +{formatElapsed(e.seconds)}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
              >
                {MODE_LABELS[e.mode]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatWhen(e.endedAt)}
              </Typography>
            </Box>
            <Tooltip title="Remove" arrow>
              <IconButton
                size="small"
                onClick={() => onRemove(e.id)}
                aria-label={`Remove overtime entry from ${formatWhen(e.endedAt)}`}
                sx={{ color: 'text.secondary', flexShrink: 0 }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Stack>
    </Stack>
  )
}
