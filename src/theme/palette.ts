export interface AccentColor {
  id: string
  name: string
  /** Main accent used in light mode */
  main: string
  /** Main accent used in dark mode (slightly brighter for contrast) */
  darkMain: string
}

/**
 * Fixed, curated palette of accent colors. No arbitrary RGB values are allowed
 * to be picked; users choose from this predefined set.
 */
export const ACCENT_COLORS: AccentColor[] = [
  { id: 'tomato', name: 'Tomato Red', main: '#e5484d', darkMain: '#ff5a5f' },
  { id: 'sunset', name: 'Sunset Orange', main: '#e2620f', darkMain: '#ff8b3d' },
  { id: 'amber', name: 'Amber', main: '#c98a00', darkMain: '#f5c518' },
  { id: 'forest', name: 'Forest', main: '#2f8f5b', darkMain: '#3ddc84' },
  { id: 'teal', name: 'Teal', main: '#0d8f8f', darkMain: '#2ee6d6' },
  { id: 'ocean', name: 'Ocean', main: '#2563c9', darkMain: '#5a9dff' },
  { id: 'indigo', name: 'Deep Indigo', main: '#4f46e5', darkMain: '#818cf8' },
  { id: 'lavender', name: 'Lavender', main: '#7c3aed', darkMain: '#a78bfa' },
  { id: 'rose', name: 'Rose', main: '#d6336c', darkMain: '#ff6b9d' },
  { id: 'slate', name: 'Slate', main: '#475569', darkMain: '#94a3b8' },
]

export const DEFAULT_ACCENT = ACCENT_COLORS[0]

export function getAccentColor(id: string): AccentColor {
  return ACCENT_COLORS.find((c) => c.id === id) ?? DEFAULT_ACCENT
}
