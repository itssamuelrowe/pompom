import type { RingtoneId } from '../types'

export interface RingtoneOption {
  id: RingtoneId
  name: string
}

export const RINGTONES: RingtoneOption[] = [
  { id: 'gentle-bell', name: 'Gentle Bell' },
  { id: 'digital-chime', name: 'Digital Chime' },
  { id: 'soft-marimba', name: 'Soft Marimba' },
  { id: 'classic-alarm', name: 'Classic Alarm' },
  { id: 'zen-gong', name: 'Zen Gong' },
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
 */
export const RINGTONE_PATTERNS: Record<RingtoneId, RingtonePattern> = {
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
    length: 2.6,
    tones: [
      { freq: 196, at: 0, dur: 2.4, type: 'sine', gain: 0.9 },
      { freq: 293.66, at: 0, dur: 2.2, type: 'sine', gain: 0.4 },
      { freq: 98, at: 0, dur: 2.4, type: 'sine', gain: 0.5 },
    ],
  },
}
