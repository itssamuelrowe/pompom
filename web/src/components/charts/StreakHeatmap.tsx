import { useMemo } from 'react'
import { Box, Tooltip, alpha, useTheme } from '@mui/material'
import { Group } from '@visx/group'
import { ParentSize } from '@visx/responsive'
import type { HeatmapDay } from '../../analytics/aggregate'
import { formatDuration } from '../../analytics/format'
import { useChartReveal } from './useChartReveal'

interface StreakHeatmapProps {
  days: HeatmapDay[]
}

const CELL_GAP = 3
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Intensity bucket 0..4 for a day's focus minutes. */
function levelFor(focusSeconds: number): number {
  const m = focusSeconds / 60
  if (m <= 0) return 0
  if (m < 25) return 1
  if (m < 60) return 2
  if (m < 120) return 3
  return 4
}

function Chart({
  days,
  width,
}: {
  days: HeatmapDay[]
  width: number
}) {
  const theme = useTheme()
  const accent = theme.palette.primary.main
  const reveal = useChartReveal(700)

  // Five-step scale from an empty-cell tint to the full accent. The empty tint
  // is kept clearly visible so the grid reads even with no activity yet.
  const levelColors = useMemo(
    () => [
      theme.palette.mode === 'dark'
        ? alpha('#ffffff', 0.14)
        : alpha('#000000', 0.08),
      alpha(accent, 0.3),
      alpha(accent, 0.5),
      alpha(accent, 0.72),
      accent,
    ],
    [accent, theme.palette.mode],
  )

  const leftGutter = 28
  const topGutter = 16

  // Group days into GitHub-style columns: each column is a week starting on
  // Sunday. The first column may be partial (padded at the top).
  const weeks = useMemo<(HeatmapDay | null)[][]>(() => {
    if (days.length === 0) return []
    const firstWeekday = new Date(days[0].date).getDay() // 0 = Sun
    const cols: (HeatmapDay | null)[][] = []
    let col: (HeatmapDay | null)[] = new Array(firstWeekday).fill(null)
    for (const d of days) {
      col.push(d)
      if (col.length === 7) {
        cols.push(col)
        col = []
      }
    }
    if (col.length > 0) {
      while (col.length < 7) col.push(null)
      cols.push(col)
    }
    return cols
  }, [days])

  // Size cells to fill the available width, trimming the oldest weeks if the
  // container is narrow so recent activity is always visible.
  const available = Math.max(0, width - leftGutter)
  const idealCell = 13
  let maxWeeks = Math.max(
    1,
    Math.floor((available + CELL_GAP) / (idealCell + CELL_GAP)),
  )
  const shownWeeks = weeks.slice(Math.max(0, weeks.length - maxWeeks))
  maxWeeks = shownWeeks.length
  const cell =
    maxWeeks > 0
      ? Math.min(
          18,
          Math.max(8, Math.floor((available - (maxWeeks - 1) * CELL_GAP) / maxWeeks)),
        )
      : idealCell

  const gridHeight = 7 * (cell + CELL_GAP)
  const height = gridHeight + topGutter + 4

  // Month labels: place one above the first week whose first day's month
  // differs from the previous week's.
  const monthMarks = useMemo(() => {
    const marks: { x: number; label: string }[] = []
    let lastMonth = -1
    shownWeeks.forEach((week, i) => {
      const firstReal = week.find((d) => d)
      if (!firstReal) return
      const month = new Date(firstReal.date).getMonth()
      if (month !== lastMonth) {
        marks.push({ x: i * (cell + CELL_GAP), label: MONTH_LABELS[month] })
        lastMonth = month
      }
    })
    return marks
  }, [shownWeeks, cell])

  if (width <= 0) return null

  return (
    <svg width={width} height={height} role="img" aria-label="Focus activity heatmap">
      {/* Month labels */}
      <Group left={leftGutter} top={0}>
        {monthMarks.map((m, i) => (
          <text
            key={`${m.label}-${i}`}
            x={m.x}
            y={10}
            fontSize={10}
            fill={theme.palette.text.secondary}
            fontFamily={theme.typography.fontFamily}
          >
            {m.label}
          </text>
        ))}
      </Group>

      {/* Weekday labels */}
      <Group left={0} top={topGutter}>
        {WEEKDAY_LABELS.map((label, row) =>
          label ? (
            <text
              key={label}
              x={0}
              y={row * (cell + CELL_GAP) + cell}
              fontSize={10}
              fill={theme.palette.text.secondary}
              fontFamily={theme.typography.fontFamily}
            >
              {label}
            </text>
          ) : null,
        )}
      </Group>

      {/* Cells. Each column fades/scales in slightly after the previous for a
          left-to-right sweep on first paint. */}
      <Group left={leftGutter} top={topGutter}>
        {shownWeeks.map((week, wi) => {
          // Stagger columns across the first ~70% of the reveal.
          const colProgress = Math.max(
            0,
            Math.min(1, (reveal - (wi / shownWeeks.length) * 0.7) / 0.3),
          )
          return week.map((day, di) => {
            if (!day) return null
            const level = levelFor(day.focus)
            const x = wi * (cell + CELL_GAP)
            const y = di * (cell + CELL_GAP)
            const title =
              day.focus > 0
                ? `${formatDuration(day.focus)} focused on ${new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
                : `No focus on ${new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`
            const scale = 0.6 + 0.4 * colProgress
            const offset = (cell * (1 - scale)) / 2
            return (
              <g key={day.date} opacity={colProgress}>
                <title>{title}</title>
                <rect
                  x={x + offset}
                  y={y + offset}
                  width={cell * scale}
                  height={cell * scale}
                  rx={2.5}
                  fill={levelColors[level]}
                  stroke={
                    level === 0
                      ? theme.palette.mode === 'dark'
                        ? alpha('#ffffff', 0.08)
                        : alpha('#000000', 0.1)
                      : alpha(theme.palette.common.black, 0.04)
                  }
                />
              </g>
            )
          })
        })}
      </Group>
    </svg>
  )
}

/**
 * GitHub-style contribution grid of daily focus time. Columns are weeks, rows
 * are weekdays, cell shade encodes how much focus happened that day. Pure SVG
 * so it stays crisp and is captured cleanly in the shared report image.
 */
export default function StreakHeatmap({ days }: StreakHeatmapProps) {
  return (
    <ParentSize>
      {({ width }) => (width > 0 ? <Chart days={days} width={width} /> : null)}
    </ParentSize>
  )
}

/** The small "Less -> More" legend shown under the heatmap. */
export function HeatmapLegend() {
  const theme = useTheme()
  const accent = theme.palette.primary.main
  const colors = [
    theme.palette.mode === 'dark' ? alpha('#ffffff', 0.14) : alpha('#000000', 0.08),
    alpha(accent, 0.3),
    alpha(accent, 0.5),
    alpha(accent, 0.72),
    accent,
  ]
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        color: 'text.secondary',
        fontSize: 11,
      }}
    >
      <span>Less</span>
      {colors.map((c, i) => (
        <Tooltip key={i} title={['None', 'Under 25m', '25m to 1h', '1h to 2h', '2h or more'][i]} arrow>
          <Box
            sx={{
              width: 11,
              height: 11,
              borderRadius: '2.5px',
              bgcolor: c,
              border: i === 0 ? 1 : 0,
              borderColor: 'divider',
            }}
          />
        </Tooltip>
      ))}
      <span>More</span>
    </Box>
  )
}
