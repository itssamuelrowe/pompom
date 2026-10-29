import { alpha, type Theme } from '@mui/material'
import type { TimeCategory } from '../../types'

/**
 * The "over" categories (overworking, overbreaking) are marked with a diagonal
 * slashed-line overlay everywhere they appear, so overtime always reads as a
 * distinct texture rather than just another shade.
 */
export const OVER_CATEGORIES: ReadonlySet<TimeCategory> = new Set<TimeCategory>([
  'overworking',
  'overbreaking',
])

export function isOverCategory(category: TimeCategory): boolean {
  return OVER_CATEGORIES.has(category)
}

/** Shared SVG pattern id for the slashed overlay. */
export const HATCH_PATTERN_ID = 'pompom-over-hatch'

/** Slash pattern geometry (user-space units). Smaller tile = more slashes. */
export const HATCH_TILE = 4
export const HATCH_STROKE = 1.5

/**
 * Color for the slashes. Every segment is the same deep accent shade, so the
 * "over" categories are distinguished purely by a white diagonal hatch laid
 * over that shade. Kept semi-transparent so it reads as texture, not a solid
 * white band.
 */
export function hatchColor(theme: Theme): string {
  void theme
  return alpha('#ffffff', 0.55)
}
