import { useCallback, useMemo } from 'react'
import { useTheme, alpha } from '@mui/material'
import { Group } from '@visx/group'
import { AreaClosed, LinePath, Bar, Line } from '@visx/shape'
import { scaleLinear, scaleTime } from '@visx/scale'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { GridRows } from '@visx/grid'
import { LinearGradient } from '@visx/gradient'
import { curveMonotoneX } from '@visx/curve'
import { ParentSize } from '@visx/responsive'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { bisector } from '@visx/vendor/d3-array'
import type { DailyBucket } from '../../analytics/aggregate'
import { focusSeconds } from '../../analytics/aggregate'
import { formatDuration, formatDurationShort } from '../../analytics/format'
import { useChartReveal } from './useChartReveal'

interface AreaTrendChartProps {
  data: DailyBucket[]
  height?: number
}

const MARGIN = { top: 16, right: 20, bottom: 36, left: 48 }

const getDate = (d: DailyBucket) => new Date(d.date)
const getFocus = (d: DailyBucket) => focusSeconds(d)
const bisectDate = bisector<DailyBucket, Date>((d) => new Date(d.date)).left

function Chart({
  data,
  width,
  height,
}: {
  data: DailyBucket[]
  width: number
  height: number
}) {
  const theme = useTheme()
  const accent = theme.palette.primary.main
  const gradientId = 'area-trend-gradient'
  const reveal = useChartReveal(800)

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<DailyBucket>()
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom)

  const xScale = useMemo(() => {
    // `data` is always non-empty when the chart renders (see the guard below);
    // the `?? 0` keeps the domain a pure function of props for safety.
    const first = data[0]?.date ?? 0
    const last = data[data.length - 1]?.date ?? first
    return scaleTime<number>({
      domain: [new Date(first), new Date(last)],
      range: [0, innerWidth],
    })
  }, [data, innerWidth])

  const maxFocus = useMemo(
    () => Math.max(60, ...data.map(getFocus)),
    [data],
  )
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxFocus],
        range: [innerHeight, 0],
        nice: true,
      }),
    [maxFocus, innerHeight],
  )

  const handleTooltip = useCallback(
    (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
      const point = localPoint(event)
      if (!point) return
      const x0 = xScale.invert(point.x - MARGIN.left)
      const index = bisectDate(data, x0, 1)
      const d0 = data[index - 1]
      const d1 = data[index]
      let d = d0
      if (d1) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0
      }
      if (!d) return
      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(getDate(d)) + MARGIN.left,
        tooltipTop: yScale(getFocus(d)) + MARGIN.top,
      })
    },
    [data, xScale, yScale, showTooltip],
  )

  if (innerWidth <= 0 || innerHeight <= 0 || data.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={containerRef} width={width} height={height}>
        <LinearGradient
          id={gradientId}
          from={accent}
          to={accent}
          fromOpacity={0.35}
          toOpacity={0.02}
        />
        {/* Wipe the area/line in from the left on entrance. */}
        <clipPath id="area-trend-clip">
          <rect x={0} y={-4} width={innerWidth * reveal} height={innerHeight + 8} />
        </clipPath>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke={theme.palette.divider}
            strokeDasharray="2,4"
            numTicks={4}
          />
          <g clipPath="url(#area-trend-clip)">
            <AreaClosed<DailyBucket>
              data={data}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScale(getFocus(d)) ?? 0}
              yScale={yScale}
              curve={curveMonotoneX}
              fill={`url(#${gradientId})`}
            />
            <LinePath<DailyBucket>
              data={data}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScale(getFocus(d)) ?? 0}
              curve={curveMonotoneX}
              stroke={accent}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
          <AxisLeft
            scale={yScale}
            numTicks={4}
            tickFormat={(v) => formatDurationShort(Number(v))}
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
            numTicks={Math.min(6, data.length)}
            stroke={theme.palette.divider}
            hideTicks
            tickFormat={(value) =>
              new Date(value as Date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
            }
            tickLabelProps={() => ({
              fill: theme.palette.text.secondary,
              fontSize: 11,
              textAnchor: 'middle',
              dy: 2,
              fontFamily: theme.typography.fontFamily,
            })}
          />
          <Bar
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleTooltip}
            onTouchMove={handleTooltip}
            onTouchStart={handleTooltip}
            onMouseLeave={hideTooltip}
          />
          {tooltipOpen && tooltipData && (
            <g>
              <Line
                from={{ x: (tooltipLeft ?? 0) - MARGIN.left, y: 0 }}
                to={{ x: (tooltipLeft ?? 0) - MARGIN.left, y: innerHeight }}
                stroke={theme.palette.divider}
                strokeWidth={1}
                strokeDasharray="4,3"
                pointerEvents="none"
              />
              <circle
                cx={(tooltipLeft ?? 0) - MARGIN.left}
                cy={(tooltipTop ?? 0) - MARGIN.top}
                r={5}
                fill={accent}
                stroke={theme.palette.background.paper}
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
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
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {new Date(tooltipData.date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div style={{ color: theme.palette.text.secondary }}>
            {formatDuration(getFocus(tooltipData))} focused
          </div>
        </TooltipInPortal>
      )}
    </div>
  )
}

/** Focus-time trend as a smooth gradient area, responsive to its container. */
export default function AreaTrendChart({
  data,
  height = 240,
}: AreaTrendChartProps) {
  return (
    <ParentSize>
      {({ width }) =>
        width > 0 ? <Chart data={data} width={width} height={height} /> : null
      }
    </ParentSize>
  )
}
