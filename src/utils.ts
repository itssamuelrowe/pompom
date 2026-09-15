export function formatTime(totalSeconds: number): string {
  const secs = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
