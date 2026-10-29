import type { Theme } from '@mui/material'
import { darken } from '@mui/material'
import type { TimeCategory } from '../types'

/**
 * Human-friendly duration: "2h 05m", "45m", "30s". Chooses the largest two
 * useful units so long totals stay readable (unlike the mm:ss timer display,
 * which has no hour handling).
 */
export function formatDuration(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds))
  if (secs < 60) return `${secs}s`
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  const s = secs % 60
  if (m < 10 && s > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${m}m`
}

/** Compact duration for tight axis labels: "2h", "45m", "30s". */
export function formatDurationShort(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds))
  if (secs < 60) return `${secs}s`
  const h = secs / 3600
  if (h >= 1) return `${Math.round(h * 10) / 10}h`
  return `${Math.round(secs / 60)}m`
}

/**
 * Palette for the four time categories. Color is now a single accent shade for
 * all four: work vs break is encoded by the axis side (work stacks up, break
 * stacks down in the diverging bar chart), and the "over" variants are marked
 * with a white hatch overlay rather than a different color. So every category
 * resolves to the same deep accent tone and the charts stay fully monochrome.
 */
export function categoryColors(theme: Theme): Record<TimeCategory, string> {
  // A deep, saturated anchor of the accent (roughly a "900" shade) that reads
  // strongly on both light and dark surfaces.
  const base =
    theme.palette.mode === 'dark'
      ? theme.palette.primary.main
      : darken(theme.palette.primary.main, 0.1)
  return {
    working: base,
    overworking: base,
    breaking: base,
    overbreaking: base,
  }
}
