import { useTheme } from '@mui/material'
import { CATEGORY_LABELS, type TimeCategory } from '../../types'
import type { CategoryTotals } from '../../analytics/aggregate'
import { CATEGORY_ORDER } from '../../analytics/aggregate'
import { categoryColors, formatDuration } from '../../analytics/format'
import { hatchColor, isOverCategory } from './hatch'

interface CategoryLegendProps {
  totals: CategoryTotals
  /** Currently highlighted category (hover-synced across charts). */
  active?: TimeCategory | null
  /** Report hover so sibling charts can highlight the same segment. */
  onActiveChange?: (category: TimeCategory | null) => void
}

/**
 * Shared legend for the category charts. Hovering an item reports the category
 * up so the donut and the stacked bars highlight the matching segments, and
 * the item itself dims when another is active.
 */
export default function CategoryLegend({
  totals,
  active,
  onActiveChange,
}: CategoryLegendProps) {
  const theme = useTheme()
  const colors = categoryColors(theme)
  const hatch = hatchColor(theme)

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 14px',
        justifyContent: 'center',
      }}
    >
      {CATEGORY_ORDER.map((category) => {
        const dimmed = active != null && active !== category
        const over = isOverCategory(category)
        return (
          <button
            key={category}
            type="button"
            onMouseEnter={() => onActiveChange?.(category)}
            onMouseLeave={() => onActiveChange?.(null)}
            onFocus={() => onActiveChange?.(category)}
            onBlur={() => onActiveChange?.(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 999,
              border: 'none',
              cursor: 'default',
              background:
                active === category ? theme.palette.action.hover : 'transparent',
              opacity: dimmed ? 0.45 : 1,
              transition: 'opacity 150ms ease, background 150ms ease',
              font: 'inherit',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: over
                  ? `repeating-linear-gradient(45deg, ${hatch} 0 1.5px, transparent 1.5px 4px), ${colors[category]}`
                  : colors[category],
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: theme.palette.text.secondary,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {CATEGORY_LABELS[category]}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatDuration(totals[category])}
            </span>
          </button>
        )
      })}
    </div>
  )
}
