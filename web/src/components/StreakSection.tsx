import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Paper, Typography, alpha, useTheme } from '@mui/material'
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import StreakHeatmap, { HeatmapLegend } from './charts/StreakHeatmap'
import { useSessionTracker } from '../hooks/useSessionTracker'
import { buildHeatmap, summarize } from '../analytics/aggregate'

function StreakStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: string
  label: string
  color: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color,
          bgcolor: alpha(color, 0.12),
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.05,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

/**
 * Home-screen streak block: current and longest streaks, active days, and a
 * GitHub-style heatmap of daily focus over the past year. Reads straight from
 * the session tracker so it stays in sync as sessions are logged.
 */
export default function StreakSection() {
  const theme = useTheme()
  const { records } = useSessionTracker()

  const summary = useMemo(() => summarize(records, 30), [records])
  const heatmap = useMemo(() => buildHeatmap(records, 364), [records])
  const activeDays = useMemo(
    () => heatmap.filter((d) => d.focus > 0).length,
    [heatmap],
  )

  const hasAny = records.length > 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1.2 }}
          >
            Your streaks
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Showing up beats pushing hard. Keep the squares warm.
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to="/analytics"
          size="small"
          startIcon={<InsightsRoundedIcon fontSize="small" />}
          sx={{ color: 'text.secondary' }}
        >
          Full analytics
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <StreakStat
          icon={<LocalFireDepartmentRoundedIcon />}
          value={`${summary.currentStreak}d`}
          label="Current streak"
          color={theme.palette.warning.main}
        />
        <StreakStat
          icon={<EmojiEventsRoundedIcon />}
          value={`${summary.longestStreak}d`}
          label="Longest streak"
          color={theme.palette.primary.main}
        />
        <StreakStat
          icon={<CalendarMonthRoundedIcon />}
          value={String(activeDays)}
          label="Active days"
          color={theme.palette.info.main}
        />
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <StreakHeatmap days={heatmap} />
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <HeatmapLegend />
      </Box>

      {!hasAny && (
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}
        >
          Finish your first pomodoro and this grid starts filling in.
        </Typography>
      )}
    </Paper>
  )
}
