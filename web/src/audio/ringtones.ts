import type { RingtoneId } from '../types'

export interface RingtoneOption {
  id: RingtoneId
  name: string
}

/** The special "surprise me" option that picks a random tone each time. */
export const RANDOM_RINGTONE_ID: RingtoneId = 'random'

export const RINGTONES: RingtoneOption[] = [
  { id: 'gentle-bell', name: 'Gentle Bell' },
  { id: 'digital-chime', name: 'Digital Chime' },
  { id: 'soft-marimba', name: 'Soft Marimba' },
  { id: 'classic-alarm', name: 'Classic Alarm' },
  { id: 'zen-gong', name: 'Zen Gong' },
  { id: 'crystal-ping', name: 'Crystal Ping' },
  { id: 'warm-pluck', name: 'Warm Pluck' },
  { id: 'bubble-pop', name: 'Bubble Pop' },
  { id: 'rising-arp', name: 'Rising Arpeggio' },
  { id: 'wood-block', name: 'Wood Block' },
  { id: 'cosmic-shimmer', name: 'Cosmic Shimmer' },
  { id: RANDOM_RINGTONE_ID, name: 'Random (surprise me)' },
]

interface Tone {
  /** Frequency in Hz */
  freq: number
  /** Start offset in seconds from the beginning of the pattern */
  at: number
  /** Duration in seconds */
  dur: number
  type?: OscillatorType
  /** Peak gain multiplier (0-1) */
  gain?: number
}

export interface RingtonePattern {
  /** Total length of one loop iteration in seconds */
  length: number
  tones: Tone[]
}

/**
 * Each ringtone is defined purely as a set of oscillator tones so it can be
 * synthesized locally with the Web Audio API — no hosted audio files needed.
 *
 * Note: 'random' has no pattern of its own; it is resolved to one of the real
 * patterns below at playback time (see PLAYABLE_RINGTONE_IDS).
 */
export const RINGTONE_PATTERNS: Record<
  Exclude<RingtoneId, 'random'>,
  RingtonePattern
> = {
  'gentle-bell': {
    length: 1.6,
    tones: [
      { freq: 880, at: 0, dur: 1.2, type: 'sine', gain: 0.9 },
      { freq: 1320, at: 0, dur: 1.2, type: 'sine', gain: 0.35 },
      { freq: 660, at: 0.4, dur: 1.0, type: 'sine', gain: 0.5 },
    ],
  },
  'digital-chime': {
    length: 1.2,
    tones: [
      { freq: 987.77, at: 0, dur: 0.18, type: 'triangle', gain: 0.8 },
      { freq: 1318.51, at: 0.2, dur: 0.18, type: 'triangle', gain: 0.8 },
      { freq: 1567.98, at: 0.4, dur: 0.3, type: 'triangle', gain: 0.8 },
    ],
  },
  'soft-marimba': {
    length: 1.4,
    tones: [
      { freq: 523.25, at: 0, dur: 0.35, type: 'sine', gain: 0.9 },
      { freq: 659.25, at: 0.25, dur: 0.35, type: 'sine', gain: 0.9 },
      { freq: 783.99, at: 0.5, dur: 0.5, type: 'sine', gain: 0.9 },
    ],
  },
  'classic-alarm': {
    length: 1.0,
    tones: [
      { freq: 1000, at: 0, dur: 0.12, type: 'square', gain: 0.5 },
      { freq: 1000, at: 0.2, dur: 0.12, type: 'square', gain: 0.5 },
      { freq: 1000, at: 0.4, dur: 0.12, type: 'square', gain: 0.5 },
      { freq: 1000, at: 0.6, dur: 0.12, type: 'square', gain: 0.5 },
    ],
  },
  'zen-gong': {
    // Shorter loop so strikes repeat more often; each strike still rings out a
    // little longer than the loop for a natural overlapping gong tail.
    length: 1.3,
    tones: [
      // Low frequencies are perceived as quieter, so the gong is driven hard
      // (the master limiter tames the summed peak). A brighter harmonic at
      // 392 Hz adds presence so it cuts through and reads as louder.
      { freq: 196, at: 0, dur: 1.5, type: 'triangle', gain: 0.9 },
      { freq: 392, at: 0, dur: 1.2, type: 'sine', gain: 0.45 },
      { freq: 293.66, at: 0, dur: 1.3, type: 'sine', gain: 0.4 },
      { freq: 98, at: 0, dur: 1.5, type: 'sine', gain: 0.55 },
    ],
  },
  'crystal-ping': {
    // Bright, glassy two-note ping with a sparkling high harmonic.
    length: 1.5,
    tones: [
      { freq: 1760, at: 0, dur: 0.5, type: 'sine', gain: 0.7 },
      { freq: 2637, at: 0, dur: 0.4, type: 'sine', gain: 0.25 },
      { freq: 2093, at: 0.3, dur: 0.6, type: 'sine', gain: 0.55 },
    ],
  },
  'warm-pluck': {
    // A mellow, rounded plucked-string feel using a triangle fundamental.
    length: 1.3,
    tones: [
      { freq: 329.63, at: 0, dur: 0.5, type: 'triangle', gain: 0.9 },
      { freq: 659.25, at: 0, dur: 0.4, type: 'sine', gain: 0.3 },
      { freq: 493.88, at: 0.3, dur: 0.6, type: 'triangle', gain: 0.7 },
    ],
  },
  'bubble-pop': {
    // Playful, bouncy pops rising in pitch.
    length: 1.0,
    tones: [
      { freq: 440, at: 0, dur: 0.1, type: 'sine', gain: 0.8 },
      { freq: 587.33, at: 0.15, dur: 0.1, type: 'sine', gain: 0.8 },
      { freq: 880, at: 0.3, dur: 0.12, type: 'sine', gain: 0.8 },
    ],
  },
  'rising-arp': {
    // A quick ascending arpeggio — motivating "level up" feel.
    length: 1.4,
    tones: [
      { freq: 523.25, at: 0, dur: 0.18, type: 'triangle', gain: 0.75 },
      { freq: 659.25, at: 0.16, dur: 0.18, type: 'triangle', gain: 0.75 },
      { freq: 783.99, at: 0.32, dur: 0.18, type: 'triangle', gain: 0.75 },
      { freq: 1046.5, at: 0.48, dur: 0.4, type: 'triangle', gain: 0.8 },
    ],
  },
  'wood-block': {
    // Dry, percussive ticks — subtle and non-intrusive.
    length: 0.9,
    tones: [
      { freq: 1200, at: 0, dur: 0.06, type: 'square', gain: 0.4 },
      { freq: 900, at: 0.25, dur: 0.07, type: 'square', gain: 0.4 },
      { freq: 1200, at: 0.5, dur: 0.06, type: 'square', gain: 0.4 },
    ],
  },
  'cosmic-shimmer': {
    // Airy, ambient swell with layered detuned sines for a shimmer.
    length: 2.0,
    tones: [
      { freq: 659.25, at: 0, dur: 1.8, type: 'sine', gain: 0.5 },
      { freq: 988, at: 0.2, dur: 1.5, type: 'sine', gain: 0.3 },
      { freq: 1318.51, at: 0.5, dur: 1.3, type: 'sine', gain: 0.22 },
      { freq: 1976, at: 0.9, dur: 1.0, type: 'sine', gain: 0.14 },
    ],
  },
}

/** Ids that have an actual synthesized pattern (everything except 'random'). */
export const PLAYABLE_RINGTONE_IDS = Object.keys(
  RINGTONE_PATTERNS,
) as Exclude<RingtoneId, 'random'>[]

/**
 * Resolve a ringtone id to a concrete, playable one. 'random' is mapped to a
 * randomly chosen real tone; everything else passes through unchanged.
 */
export function resolveRingtone(
  id: RingtoneId,
): Exclude<RingtoneId, 'random'> {
  if (id !== 'random') return id
  const i = Math.floor(Math.random() * PLAYABLE_RINGTONE_IDS.length)
  return PLAYABLE_RINGTONE_IDS[i]
}
