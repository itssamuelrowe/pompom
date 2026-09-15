import type { RingtoneId } from '../types'
import { RINGTONE_PATTERNS } from './ringtones'

type StateListener = (playing: boolean, blocked: boolean) => void

/**
 * Synthesizes ringtones with the Web Audio API. Handles browser autoplay
 * restrictions gracefully: the context is created/resumed on first user
 * interaction and playback failures never throw to the caller.
 */
export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private loopTimer: number | null = null
  private scheduledNodes: AudioScheduledSourceNode[] = []
  private playing = false
  private blocked = false
  private volume = 0.7
  private listeners = new Set<StateListener>()

  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn)
    fn(this.playing, this.blocked)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const fn of this.listeners) fn(this.playing, this.blocked)
  }

  /** Must be called from within a user gesture to satisfy autoplay policies. */
  init(): void {
    if (this.ctx) {
      void this.ctx.resume().catch(() => undefined)
      return
    }
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      this.ctx = new Ctor()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.ctx.destination)
      this.blocked = false
    } catch {
      this.blocked = true
    }
    this.emit()
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.02,
      )
    }
  }

  get isPlaying(): boolean {
    return this.playing
  }

  private scheduleIteration(ringtone: RingtoneId, startTime: number): number {
    if (!this.ctx || !this.masterGain) return 0
    const pattern = RINGTONE_PATTERNS[ringtone]
    for (const tone of pattern.tones) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = tone.type ?? 'sine'
      osc.frequency.value = tone.freq
      const peak = tone.gain ?? 0.8
      const t0 = startTime + tone.at
      // Quick attack, exponential-ish decay for a natural bell/marimba feel.
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur)
      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start(t0)
      osc.stop(t0 + tone.dur + 0.05)
      this.scheduledNodes.push(osc)
      osc.onended = () => {
        const i = this.scheduledNodes.indexOf(osc)
        if (i >= 0) this.scheduledNodes.splice(i, 1)
      }
    }
    return pattern.length
  }

  /**
   * Play a ringtone. When `loop` is true the sound repeats indefinitely until
   * stop() is called. Otherwise it repeats for `finiteSeconds` (default 5s) and
   * then stops on its own.
   */
  play(ringtone: RingtoneId, loop: boolean, finiteSeconds = 5): void {
    this.init()
    if (!this.ctx || !this.masterGain) {
      this.blocked = true
      this.emit()
      return
    }

    void this.ctx.resume().catch(() => {
      this.blocked = true
      this.emit()
    })

    this.stopNodes()
    this.playing = true
    this.blocked = false
    this.emit()

    const length = RINGTONE_PATTERNS[ringtone].length
    const deadline = loop ? Infinity : Date.now() + finiteSeconds * 1000

    const startNext = () => {
      if (!this.playing || !this.ctx) return
      if (Date.now() >= deadline) {
        this.stop()
        return
      }
      this.scheduleIteration(ringtone, this.ctx.currentTime + 0.02)
      this.loopTimer = window.setTimeout(startNext, length * 1000)
    }
    startNext()
  }

  /**
   * Short UI click/tick used for button feedback. Deliberately independent of
   * the ringtone loop so it can fire while other audio is (or isn't) playing.
   */
  click(kind: 'start' | 'stop' = 'start'): void {
    this.init()
    if (!this.ctx || !this.masterGain) return
    void this.ctx.resume().catch(() => undefined)
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    // A rising blip for start/resume, a lower falling blip for pause/stop.
    const f0 = kind === 'start' ? 660 : 520
    const f1 = kind === 'start' ? 990 : 330
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f0, now)
    osc.frequency.exponentialRampToValueAtTime(f1, now + 0.08)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.linearRampToValueAtTime(0.28, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  /**
   * Preview a ringtone. Loops the pattern for at least 5 seconds (rounding up
   * to a whole number of iterations) so the user hears the full character of
   * the tone, then stops automatically.
   */
  preview(ringtone: RingtoneId, minSeconds = 5): void {
    const length = RINGTONE_PATTERNS[ringtone].length
    // Round up so we never cut a pattern off mid-way and always reach >= 5s.
    const iterations = Math.max(1, Math.ceil(minSeconds / length))
    this.play(ringtone, false, iterations * length)
  }

  private stopNodes() {
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer)
      this.loopTimer = null
    }
    for (const node of this.scheduledNodes) {
      try {
        node.stop()
      } catch {
        /* already stopped */
      }
    }
    this.scheduledNodes = []
  }

  stop(): void {
    this.stopNodes()
    if (this.playing) {
      this.playing = false
      this.emit()
    }
  }
}

export const audioManager = new AudioManager()
