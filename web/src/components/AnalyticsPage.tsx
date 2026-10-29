import { useCallback, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Snackbar,
  Alert,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import TimerRoundedIcon from '@mui/icons-material/TimerRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import Logo from './Logo'
import WorkspaceToolbar from './WorkspaceToolbar'
import StatCard from './charts/StatCard'
import StackedBarChart from './charts/StackedBarChart'
import AreaTrendChart from './charts/AreaTrendChart'
import DonutChart from './charts/DonutChart'
import CategoryLegend from './charts/CategoryLegend'
import type { TimeCategory } from '../types'
import { useSessionTracker } from '../hooks/useSessionTracker'
import { summarize } from '../analytics/aggregate'
import { categoryColors, formatDuration } from '../analytics/format'
import { shareReportImage, type ShareOutcome } from '../analytics/share'
import { generateSampleRecords } from '../analytics/sampleData'

/** Chart windows the user can switch between. */
const RANGES = [
  { days: 7, label: '7D' },
  { days: 14, label: '14D' },
  { days: 30, label: '30D' },
] as const

type RangeDays = (typeof RANGES)[number]['days']

function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  )
}

export default function AnalyticsPage() {
  const theme = useTheme()
  const { records: realRecords, clear } = useSessionTracker()
  const [rangeDays, setRangeDays] = useState<RangeDays>(14)

  // Shared hover highlight: hovering the legend, a donut arc, or a bar segment
  // highlights the matching category across the donut and the stacked bars.
  const [activeCategory, setActiveCategory] = useState<TimeCategory | null>(null)

  // Dummy-data preview: when on, the whole screen renders from a generated
  // sample set instead of the user's real (possibly empty) history. Nothing is
  // persisted; it only lets people see what the screen looks like with data.
  const [useSample, setUseSample] = useState(false)
  const sampleRecords = useMemo(() => generateSampleRecords(30), [])
  const records = useSample ? sampleRecords : realRecords

  const summary = useMemo(
    () => summarize(records, rangeDays),
    [records, rangeDays],
  )
  const colors = useMemo(() => categoryColors(theme), [theme])

  const focusTotal = summary.totals.working + summary.totals.overworking
  const breakTotal = summary.totals.breaking + summary.totals.overbreaking

  const hasData = summary.sessionCount > 0

  // The capture target: the report body (stats + charts), excluding the
  // sticky toolbar which is marked data-share-exclude.
  const reportRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [toast, setToast] = useState<{
    severity: 'success' | 'error'
    message: string
  } | null>(null)

  const outcomeMessage: Record<ShareOutcome, string> = {
    shared: 'Shared your report.',
    copied: 'Report image copied. Paste it anywhere.',
    downloaded: 'Report image saved to your downloads.',
    cancelled: '',
  }

  const handleShare = useCallback(async () => {
    const node = reportRef.current
    if (!node || sharing) return
    setSharing(true)
    // Let the "sharing" re-render paint (reveals the branded header) before we
    // snapshot the DOM.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    try {
      const outcome = await shareReportImage(node, {
        backgroundColor: theme.palette.background.default,
        filename: `pompom-report-${new Date().toISOString().slice(0, 10)}.png`,
        title: 'My PomPom focus report',
      })
      if (outcome !== 'cancelled') {
        setToast({ severity: 'success', message: outcomeMessage[outcome] })
      }
    } catch {
      setToast({
        severity: 'error',
        message: "Couldn't generate the image. Please try again.",
      })
    } finally {
      setSharing(false)
    }
    // outcomeMessage is a stable literal; theme bg is the only real dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharing, theme.palette.background.default])

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Shared toolbar (excluded from the shared screenshot) */}
      <Box data-share-exclude="true">
        <WorkspaceToolbar
          title="Analytics"
          subtitle="Your real pattern"
          backTo="/"
          backLabel="Back to timer"
          hideLogo
        >
          <Tooltip title="Preview with sample data" arrow>
            <FormControlLabel
              sx={{ mr: 0.5, display: { xs: 'none', sm: 'flex' } }}
              control={
                <Switch
                  size="small"
                  checked={useSample}
                  onChange={(e) => setUseSample(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Sample data
                </Typography>
              }
            />
          </Tooltip>
          {/* Compact toggle for small screens */}
          <Tooltip title="Preview with sample data" arrow>
            <ToggleButton
              value="sample"
              size="small"
              selected={useSample}
              onChange={() => setUseSample((v) => !v)}
              aria-label="Preview with sample data"
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, border: 0 }}
            >
              <ScienceRoundedIcon fontSize="small" />
            </ToggleButton>
          </Tooltip>

          {hasData && (
            <Button
              variant="contained"
              size="small"
              onClick={handleShare}
              disabled={sharing}
              startIcon={
                sharing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IosShareRoundedIcon />
                )
              }
              sx={{ flexShrink: 0 }}
            >
              {sharing ? 'Preparing' : 'Share'}
            </Button>
          )}
        </WorkspaceToolbar>
      </Box>

      {/* Body (the capture target when sharing) */}
      <Box
        ref={reportRef}
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {!hasData ? (
          <EmptyState />
        ) : (
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {useSample && (
              <Box
                data-share-exclude="true"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  icon={<ScienceRoundedIcon />}
                  label="Showing sample data"
                  color="primary"
                  variant="outlined"
                  size="small"
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  A preview of what this screen looks like with activity. Turn off
                  "Sample data" to see your own.
                </Typography>
              </Box>
            )}

            {/* Branded header shown only inside the shared image. */}
            <Box
              sx={{
                display: sharing ? 'flex' : 'none',
                alignItems: 'center',
                gap: 1.25,
                mb: 0.5,
              }}
            >
              <Logo size={34} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    lineHeight: 1.1,
                  }}
                >
                  My PomPom report
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {new Date().toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  · last {rangeDays} days
                </Typography>
              </Box>
            </Box>

            {/* Summary stat grid */}
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 1.5, sm: 2 },
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
              }}
            >
              <StatCard
                label="Focus time"
                value={formatDuration(focusTotal)}
                caption={`${formatDuration(summary.totals.overworking)} past the bell`}
                icon={<TimerRoundedIcon />}
              />
              <StatCard
                label="Pomodoros"
                value={String(summary.completedPomodoros)}
                caption={`${summary.sessionCount} sessions total`}
                icon={<BoltRoundedIcon />}
                color={colors.working}
              />
              <StatCard
                label="Current streak"
                value={`${summary.currentStreak}d`}
                caption={`Longest ${summary.longestStreak} days`}
                icon={<LocalFireDepartmentRoundedIcon />}
                color={colors.overworking}
              />
              <StatCard
                label="Avg focus / day"
                value={formatDuration(summary.avgFocusPerDay)}
                caption={`${formatDuration(breakTotal)} on breaks`}
                icon={<TrendingUpRoundedIcon />}
                color={colors.breaking}
              />
            </Box>

            {/* Main charts: stacked bars + donut */}
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 2, sm: 3 },
                gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
              }}
            >
              <ChartCard
                title="Time by day"
                subtitle="Work above the line, breaks below — hatched marks overtime"
                action={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={rangeDays}
                    onChange={(_, v) => v && setRangeDays(v)}
                  >
                    {RANGES.map((r) => (
                      <ToggleButton key={r.days} value={r.days}>
                        {r.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                }
              >
                <StackedBarChart
                  data={summary.daily}
                  active={activeCategory}
                  onActiveChange={setActiveCategory}
                />
              </ChartCard>

              <ChartCard
                title="Distribution"
                subtitle="Where your time really goes"
              >
                <Stack spacing={2} sx={{ height: '100%', justifyContent: 'center' }}>
                  <Box sx={{ height: 220 }}>
                    <DonutChart
                      totals={summary.totals}
                      active={activeCategory}
                      onActiveChange={setActiveCategory}
                    />
                  </Box>
                  <CategoryLegend
                    totals={summary.totals}
                    active={activeCategory}
                    onActiveChange={setActiveCategory}
                  />
                </Stack>
              </ChartCard>
            </Box>

            {/* Focus trend */}
            <ChartCard
              title="Focus trend"
              subtitle="Total focus time per day (work + overtime)"
            >
              <Box sx={{ height: 240 }}>
                <AreaTrendChart data={summary.daily} />
              </Box>
            </ChartCard>

            {/* Mode breakdown + clear */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  alignItems: { xs: 'stretch', sm: 'center' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexGrow: 1,
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <ModeStat
                    label="Pomodoros"
                    count={summary.byMode.pomodoro}
                    color={colors.working}
                  />
                  <ModeStat
                    label="Short breaks"
                    count={summary.byMode.shortBreak}
                    color={colors.breaking}
                  />
                  <ModeStat
                    label="Long breaks"
                    count={summary.byMode.longBreak}
                    color={alpha(colors.breaking, 0.6)}
                  />
                </Box>
                <Button
                  data-share-exclude="true"
                  size="small"
                  onClick={clear}
                  disabled={useSample}
                  startIcon={<DeleteSweepRoundedIcon fontSize="small" />}
                  sx={{ color: 'text.secondary', flexShrink: 0 }}
                >
                  Clear history
                </Button>
              </Box>
            </Paper>

            {/* Footer shown only inside the shared image. */}
            <Typography
              variant="caption"
              sx={{
                display: sharing ? 'block' : 'none',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
              Tracked with PomPom · pompom focus timer
            </Typography>
          </Stack>
        )}
      </Box>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            variant="filled"
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  )
}

function ModeStat({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }}
      />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
      >
        {count}
      </Typography>
    </Box>
  )
}

function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        py: { xs: 8, sm: 12 },
        color: 'text.secondary',
      }}
    >
      <TimerRoundedIcon sx={{ fontSize: 48, opacity: 0.6 }} />
      <Typography
        variant="h5"
        sx={{ fontFamily: '"Space Grotesk", sans-serif', color: 'text.primary' }}
      >
        No sessions yet
      </Typography>
      <Typography variant="body2" sx={{ maxWidth: 360 }}>
        Run a few pomodoros and breaks. PomPom keeps counting past the bell and
        logs each run, so your real pattern shows up here. Want a look first?
        Flip on "Sample data" in the toolbar.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 1 }}>
        Start a session
      </Button>
    </Box>
  )
}
