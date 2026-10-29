import { useMemo, useState } from 'react'
import { useTheme } from '@mui/material'
import { Group } from '@visx/group'
import { Pie } from '@visx/shape'
import { Text } from '@visx/text'
import { ParentSize } from '@visx/responsive'
import { CATEGORY_LABELS, type TimeCategory } from '../../types'
import type { CategoryTotals } from '../../analytics/aggregate'
import { CATEGORY_ORDER, sumCategories } from '../../analytics/aggregate'
import { categoryColors, formatDuration } from '../../analytics/format'
import { useChartReveal } from './useChartReveal'
import {
  HATCH_PATTERN_ID,
  HATCH_STROKE,
  HATCH_TILE,
  isOverCategory,
  hatchColor,
} from './hatch'

interface DonutChartProps {
  totals: CategoryTotals
  size?: number
  /** Controlled highlight shared with the legend/bars. */
  active?: TimeCategory | null
  onActiveChange?: (category: TimeCategory | null) => void
}

interface Datum {
  category: TimeCategory
  value: number
}

function Chart({
  totals,
  size,
  active,
  onActiveChange,
}: {
  totals: CategoryTotals
  size: number
  active?: TimeCategory | null
  onActiveChange?: (category: TimeCategory | null) => void
}) {
  const theme = useTheme()
  const colors = useMemo(() => categoryColors(theme), [theme])
  const reveal = useChartReveal()

  // Support both controlled (from the page) and standalone usage.
  const [internalActive, setInternalActive] = useState<TimeCategory | null>(null)
  const activeCategory = active !== undefined ? active : internalActive
  const setActive = onActiveChange ?? setInternalActive

  const data = useMemo<Datum[]>(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        value: totals[category],
      })).filter((d) => d.value > 0),
    [totals],
  )

  const total = sumCategories(totals)
  const radius = size / 2
  const thickness = Math.max(18, radius * 0.32)

  const centerValue = activeCategory ? totals[activeCategory] : total
  const centerLabel = activeCategory
    ? CATEGORY_LABELS[activeCategory]
    : 'Total tracked'

  if (total <= 0) {
    return (
      <svg width={size} height={size}>
        <Group top={radius} left={radius}>
          <circle
            r={radius - thickness / 2}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth={thickness}
            strokeDasharray="4,6"
          />
          <Text
            textAnchor="middle"
            verticalAnchor="middle"
            fontSize={13}
            fill={theme.palette.text.secondary}
            fontFamily={theme.typography.fontFamily}
          >
            No data yet
          </Text>
        </Group>
      </svg>
    )
  }

  // Sweep the ring in on mount by scaling the overall end angle.
  const endAngle = 2 * Math.PI * reveal

  return (
    <svg width={size} height={size}>
      <defs>
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
            stroke={hatchColor(theme)}
            strokeWidth={HATCH_STROKE}
          />
        </pattern>
      </defs>
      <Group top={radius} left={radius}>
        <Pie<Datum>
          data={data}
          pieValue={(d) => d.value}
          outerRadius={radius}
          innerRadius={radius - thickness}
          cornerRadius={4}
          padAngle={0.02}
          startAngle={0}
          endAngle={endAngle}
        >
          {(pie) =>
            pie.arcs.map((arc) => {
              const { category } = arc.data
              const isActive = activeCategory === category
              const dimmed = activeCategory != null && !isActive
              const d = pie.path(arc) ?? undefined
              const clipId = `donut-arc-${category}`
              return (
                <g
                  key={category}
                  onMouseEnter={() => setActive(category)}
                  onMouseLeave={() => setActive(null)}
                  style={{ cursor: 'default', transition: 'opacity 160ms ease' }}
                  opacity={dimmed ? 0.35 : 1}
                >
                  {/* Base fill. */}
                  <path d={d} fill={colors[category]} />
                  {/* Hatch overlay, clipped to the arc so slashes never spill
                      past the segment edges. */}
                  {isOverCategory(category) && (
                    <>
                      <clipPath id={clipId}>
                        <path d={d} />
                      </clipPath>
                      <path
                        d={d}
                        clipPath={`url(#${clipId})`}
                        fill={`url(#${HATCH_PATTERN_ID})`}
                        pointerEvents="none"
                      />
                    </>
                  )}
                  {/* Paper-colored outline drawn last so the gap between
                      segments stays crisp on top of the hatch. */}
                  <path
                    d={d}
                    fill="none"
                    stroke={theme.palette.background.paper}
                    strokeWidth={isActive ? 3 : 2}
                    style={{ transition: 'stroke-width 160ms ease' }}
                  />
                </g>
              )
            })
          }
        </Pie>
        <Text
          textAnchor="middle"
          verticalAnchor="middle"
          dy={-8}
          fontSize={Math.max(18, radius * 0.22)}
          fontWeight={700}
          fill={theme.palette.text.primary}
          fontFamily="'Space Grotesk', sans-serif"
        >
          {formatDuration(centerValue)}
        </Text>
        <Text
          textAnchor="middle"
          verticalAnchor="middle"
          dy={Math.max(14, radius * 0.16)}
          fontSize={12}
          fill={
            activeCategory ? colors[activeCategory] : theme.palette.text.secondary
          }
          fontFamily={theme.typography.fontFamily}
        >
          {centerLabel}
        </Text>
      </Group>
    </svg>
  )
}

/** Category distribution donut with an interactive center readout. */
export default function DonutChart({
  totals,
  size,
  active,
  onActiveChange,
}: DonutChartProps) {
  if (size)
    return (
      <Chart
        totals={totals}
        size={size}
        active={active}
        onActiveChange={onActiveChange}
      />
    )
  return (
    <ParentSize>
      {({ width, height }) => {
        const dim = Math.max(0, Math.min(width, height || width))
        return dim > 0 ? (
          <Chart
            totals={totals}
            size={dim}
            active={active}
            onActiveChange={onActiveChange}
          />
        ) : null
      }}
    </ParentSize>
  )
}
