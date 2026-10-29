import { useMemo } from 'react'
import { useTheme, alpha } from '@mui/material'
import { Group } from '@visx/group'
import { scaleBand, scaleLinear } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { GridRows } from '@visx/grid'
import { ParentSize } from '@visx/responsive'
import {
  useTooltip,
  useTooltipInPortal,
  defaultStyles,
} from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { CATEGORY_LABELS, type TimeCategory } from '../../types'
import type { DailyBucket } from '../../analytics/aggregate'
import { categoryColors, formatDuration, formatDurationShort } from '../../analytics/format'
import { useChartReveal } from './useChartReveal'
import {
  HATCH_PATTERN_ID,
  HATCH_STROKE,
  HATCH_TILE,
  OVER_CATEGORIES,
  hatchColor,
} from './hatch'

/**
 * Diverging layout: work categories stack upward from the zero line, break
 * categories stack downward below it. Within each side the regular category
 * sits against the baseline and the "over" category caps the end, so overtime
 * always reads as the hatched tip of a column (top for work, bottom for break).
 */
const WORK_STACK: TimeCategory[] = ['working', 'overworking']
const BREAK_STACK: TimeCategory[] = ['breaking', 'overbreaking']

/** Each quadrant spans a fixed 4 hours, so the zero line stays centered. */
const QUADRANT_SECONDS = 4 * 3600

interface StackedBarChartProps {
  data: DailyBucket[]
  height?: number
  /** Controlled highlight shared with the legend/donut. */
  active?: TimeCategory | null
  onActiveChange?: (category: TimeCategory | null) => void
}

interface TooltipData {
  bucket: DailyBucket
  category: TimeCategory
  value: number
}

const MARGIN = { top: 16, right: 16, bottom: 36, left: 48 }
const MAX_BAR_WIDTH = 26

function Chart({
  data,
  width,
  height,
  active,
  onActiveChange,
}: {
  data: DailyBucket[]
  width: number
  height: number
  active?: TimeCategory | null
  onActiveChange?: (category: TimeCategory | null) => void
}) {
  const theme = useTheme()
  const colors = useMemo(() => categoryColors(theme), [theme])
  const reveal = useChartReveal()

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipData>()

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom)

  const xScale = useMemo(
    () =>
      scaleBand<number>({
        domain: data.map((d) => d.date),
        range: [0, innerWidth],
        padding: 0.34,
      }),
    [data, innerWidth],
  )

  // Fixed 4-hour scale on each side: work fills 0 -> +4h above the baseline,
  // break fills 0 -> 4h below it. A fixed domain keeps the zero line centered
  // and makes columns comparable across days and ranges rather than rescaling
  // to whatever the current window's max happens to be.
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [-QUADRANT_SECONDS, QUADRANT_SECONDS],
        range: [innerHeight, 0],
      }),
    [innerHeight],
  )

  // Only label a handful of ticks so a 30-day axis stays legible.
  const tickStep = Math.max(1, Math.ceil(data.length / 8))
  const bandWidth = xScale.bandwidth()
  const barWidth = Math.min(MAX_BAR_WIDTH, bandWidth)
  const barInset = (bandWidth - barWidth) / 2

  // Diagonal-slash hatch used to mark the "over" categories.
  const hatch = hatchColor(theme)

  if (innerWidth <= 0 || innerHeight <= 0) return null

  return (
    <div
      style={{ position: 'relative' }}
      onMouseLeave={() => onActiveChange?.(null)}
    >
      <svg ref={containerRef} width={width} height={height}>
        <defs>
          {/* Diagonal slashed lines marking overtime segments. */}
          <pattern
            id={HATCH_PATTERN_ID}
            width={HATCH_TILE}
            height={HATCH_TILE}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={HATCH_TILE}
              stroke={hatch}
              strokeWidth={HATCH_STROKE}
            />
          </pattern>
        </defs>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke={theme.palette.divider}
            strokeDasharray="2,5"
            tickValues={[-4, -3, -2, -1, 1, 2, 3, 4].map((h) => h * 3600)}
          />
          {data.map((bucket) => {
            const bandX = xScale(bucket.date)
            if (bandX == null) return null
            const x = bandX + barInset

            // Build the segments for one day. `dir = -1` means stacking up
            // (work, toward smaller y), `dir = +1` means stacking down (break).
            const buildSide = (
              keys: TimeCategory[],
              dir: -1 | 1,
            ): {
              key: TimeCategory
              yTop: number
              h: number
              outer: boolean
            }[] => {
              const segs: {
                key: TimeCategory
                yTop: number
                h: number
                outer: boolean
              }[] = []
              let cumulative = 0 // signed seconds away from the baseline
              const last = keys.length - 1
              // Keep every edge inside the plot so a rare >4h day is capped at
              // the quadrant edge instead of spilling past it.
              const clampY = (y: number) => Math.max(0, Math.min(innerHeight, y))
              keys.forEach((key, i) => {
                const value = bucket[key]
                if (value <= 0) return
                const start = clampY(yScale(dir === -1 ? cumulative : -cumulative))
                cumulative += value
                const end = clampY(yScale(dir === -1 ? cumulative : -cumulative))
                const yTop = Math.min(start, end)
                segs.push({
                  key,
                  yTop,
                  h: Math.abs(end - start),
                  // The outermost segment (the tip of the column) is the one
                  // that must keep a crisp edge; inner ones overlap by 0.5px.
                  outer: i === last || keys.slice(i + 1).every((k) => bucket[k] <= 0),
                })
              })
              return segs
            }

            const segments = [
              ...buildSide(WORK_STACK, -1),
              ...buildSide(BREAK_STACK, 1),
            ]
            const zeroY = yScale(0)

            return segments.map((seg) => {
              const dimmed = active != null && active !== seg.key
              const isOver = OVER_CATEGORIES.has(seg.key)

              // Draw each segment in its OWN band — [yTop, yTop + h] — so
              // stacked segments sit on top of one another instead of all
              // starting at the baseline (which previously made the overtime
              // tip cover the whole column). The reveal animation scales each
              // edge's distance from the zero baseline, so the whole column
              // grows out of the center line together.
              const scaledTop = zeroY + (seg.yTop - zeroY) * reveal
              const scaledBottom = zeroY + (seg.yTop + seg.h - zeroY) * reveal
              const top = Math.min(scaledTop, scaledBottom)
              const height = Math.abs(scaledBottom - scaledTop)
              // Overlap inner segments by 0.5px to hide anti-aliased seams.
              const drawH = Math.max(0, seg.outer ? height : height + 0.5)

              const handlers = {
                onMouseLeave: hideTooltip,
                onMouseEnter: () => onActiveChange?.(seg.key),
                onMouseMove: (event: React.MouseEvent) => {
                  const point = localPoint(event)
                  onActiveChange?.(seg.key)
                  showTooltip({
                    tooltipData: {
                      bucket,
                      category: seg.key,
                      value: bucket[seg.key],
                    },
                    tooltipLeft: point?.x,
                    tooltipTop: point?.y,
                  })
                },
              }

              return (
                <g
                  key={`bar-${bucket.date}-${seg.key}`}
                  opacity={dimmed ? 0.3 : 1}
                  style={{ transition: 'opacity 160ms ease' }}
                  {...handlers}
                >
                  <rect
                    x={x}
                    y={top}
                    width={barWidth}
                    height={drawH}
                    fill={colors[seg.key]}
                  />
                  {isOver && (
                    <rect
                      x={x}
                      y={top}
                      width={barWidth}
                      height={drawH}
                      fill={`url(#${HATCH_PATTERN_ID})`}
                    />
                  )}
                </g>
              )
            })
          })}
          {/* Zero baseline separating work (up) from break (down). */}
          <line
            x1={0}
            x2={innerWidth}
            y1={yScale(0)}
            y2={yScale(0)}
            stroke={theme.palette.text.secondary}
            strokeOpacity={0.5}
            strokeWidth={1}
          />
          <AxisLeft
            scale={yScale}
            // Clean hour ticks across the fixed -4h..+4h domain.
            tickValues={[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((h) => h * 3600)}
            // Break time lives below zero; show magnitudes on both sides so a
            // tick reads "1h of break" rather than "-1h".
            tickFormat={(v) => formatDurationShort(Math.abs(Number(v)))}
            stroke={theme.palette.divider}
            hideTicks
            tickLabelProps={() => ({
              fill: theme.palette.text.secondary,
              fontSize: 11,
              textAnchor: 'end',
              dx: -4,
              dy: 4,
              fontFamily: theme.typography.fontFamily,
            })}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={theme.palette.divider}
            hideTicks
            tickFormat={(value, index) =>
              index % tickStep === 0
                ? new Date(Number(value)).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : ''
            }
            tickLabelProps={() => ({
              fill: theme.palette.text.secondary,
              fontSize: 11,
              textAnchor: 'middle',
              dy: 2,
              fontFamily: theme.typography.fontFamily,
            })}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            ...defaultStyles,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 10,
            boxShadow: `0 8px 28px ${alpha('#000', 0.18)}`,
            padding: '8px 12px',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {new Date(tooltipData.bucket.date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: OVER_CATEGORIES.has(tooltipData.category)
                  ? `repeating-linear-gradient(45deg, ${hatch} 0 1.5px, transparent 1.5px 4px), ${colors[tooltipData.category]}`
                  : colors[tooltipData.category],
                display: 'inline-block',
              }}
            />
            <span style={{ color: theme.palette.text.secondary }}>
              {CATEGORY_LABELS[tooltipData.category]}
            </span>
            <strong style={{ marginLeft: 'auto', paddingLeft: 12 }}>
              {formatDuration(tooltipData.value)}
            </strong>
          </div>
        </TooltipInPortal>
      )}
    </div>
  )
}

/** Daily time-usage stacked by category, responsive to its container width. */
export default function StackedBarChart({
  data,
  height = 280,
  active,
  onActiveChange,
}: StackedBarChartProps) {
  return (
    <ParentSize>
      {({ width }) =>
        width > 0 ? (
          <Chart
            data={data}
            width={width}
            height={height}
            active={active}
            onActiveChange={onActiveChange}
          />
        ) : null
      }
    </ParentSize>
  )
}
