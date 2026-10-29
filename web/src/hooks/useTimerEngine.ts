import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTimer } from './useTimer'
import { useOvertimeLog } from './useOvertimeLog'
import { useSessionTracker } from './useSessionTracker'
import { useIdleNotifications } from './useIdleNotifications'
import { audioManager } from '../audio/AudioManager'
import { pressFeedback } from '../audio/feedback'
import type { useSettings } from './useSettings'
import type { RingtoneId, TimerMode, TimerStatus } from '../types'
import type { Template } from '../templates'

/** The settings slice the engine needs: the object plus its mutators. */
export interface TimerEngineSettings {
  settings: ReturnType<typeof useSettings>['settings']
  update: ReturnType<typeof useSettings>['update']
  reset: ReturnType<typeof useSettings>['reset']
  applyTemplate: ReturnType<typeof useSettings>['applyTemplate']
  applyCustom: ReturnType<typeof useSettings>['applyCustom']
}

/**
 * Everything the timer UI (full screen and mini widget) needs. The engine is
 * the single source of truth for the running session; both views render from
 * the same instance so navigation never resets the countdown.
 */
export interface TimerEngine extends TimerEngineSettings {
  // Live timer state
  currentMode: TimerMode
  status: TimerStatus
  remaining: number
  durationSeconds: number
  progress: number
  isBreak: boolean

  // Session progress
  completedPomodoros: number
  sessionNumber: number
  filledDots: number
  pool: number

  // Overtime
  overtimeStart: number | null
  overtimeSeconds: number
  overtimeMode: TimerMode

  // Logs
  overtimeLog: ReturnType<typeof useOvertimeLog>

  // Audio / UI flags
  audioBlocked: boolean
  setAudioBlocked: (v: boolean) => void
  isPreviewing: boolean
  notificationPermission: ReturnType<typeof useIdleNotifications>['permission']
  requestPermission: ReturnType<typeof useIdleNotifications>['requestPermission']

  // Actions
  handleStart: () => void
  handlePause: () => void
  handleReset: () => void
  handleSkip: () => void
  handleStopRinging: () => void
  handleModeChange: (m: TimerMode) => void
  handleSelectTemplate: (t: Template) => void
  dismissOvertime: () => void
  handlePreview: (r: RingtoneId) => void
  handleStopPreview: () => void
  handlePreviewIdleSound: () => void
}

/**
 * Owns the complete timer lifecycle: countdown, mode cycling, overtime
 * tracking, analytics session recording, idle reminders and audio. Extracted
 * from the old App body so it can live in a provider that stays mounted across
 * routes (the mini timer depends on this).
 */
export function useTimerEngine(settingsApi: TimerEngineSettings): TimerEngine {
  const { settings, update, reset, applyTemplate, applyCustom } = settingsApi

  const [currentMode, setCurrentMode] = useState<TimerMode>('pomodoro')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [overtimeStart, setOvertimeStart] = useState<number | null>(null)
  const [overtimeSeconds, setOvertimeSeconds] = useState(0)
  const [overtimeMode, setOvertimeMode] = useState<TimerMode>('pomodoro')

  const overtimeLog = useOvertimeLog()

  const { record: recordSession } = useSessionTracker()
  const recordSessionRef = useRef(recordSession)
  useEffect(() => {
    recordSessionRef.current = recordSession
  }, [recordSession])

  const pendingSessionRef = useRef<{
    mode: TimerMode
    plannedSeconds: number
    activeSeconds: number
    completed: boolean
  } | null>(null)

  const activeStartRef = useRef<number | null>(null)
  const activeAccumRef = useRef(0)

  const isBreak = currentMode !== 'pomodoro'

  const durationFor = useCallback(
    (m: TimerMode): number => {
      switch (m) {
        case 'pomodoro':
          return settings.pomodoroDuration * 60
        case 'shortBreak':
          return settings.shortBreakDuration * 60
        case 'longBreak':
          return settings.longBreakDuration * 60
      }
    },
    [
      settings.pomodoroDuration,
      settings.shortBreakDuration,
      settings.longBreakDuration,
    ],
  )

  const durationSeconds = durationFor(currentMode)

  const advanceRef = useRef<() => void>(() => {})
  const markRingingRef = useRef<() => void>(() => {})

  const currentModeRef = useRef<TimerMode>(currentMode)
  useEffect(() => {
    currentModeRef.current = currentMode
  }, [currentMode])

  const autoStartPendingRef = useRef(false)
  const [autoStartTrigger, setAutoStartTrigger] = useState(0)

  const sessionEndReminderRef = useRef<(mode: TimerMode) => void>(() => {})
  const pendingModeRef = useRef<TimerMode | null>(null)

  const handleComplete = useCallback(() => {
    const finishedMode = currentModeRef.current
    advanceRef.current()
    const nextMode = pendingModeRef.current ?? currentModeRef.current

    sessionEndReminderRef.current(finishedMode)

    const plannedSeconds = durationFor(finishedMode)
    activeStartRef.current = null
    activeAccumRef.current = 0

    if (settings.autoStartNext) {
      audioManager.play(settings.ringtone, false)
      recordSessionRef.current({
        mode: finishedMode,
        plannedSeconds,
        activeSeconds: plannedSeconds,
        overtimeSeconds: 0,
        completed: true,
      })
      setOvertimeStart(null)
      pendingModeRef.current = null
      autoStartPendingRef.current = true
      setCurrentMode(nextMode)
      setAutoStartTrigger((n) => n + 1)
      return
    }

    audioManager.play(settings.ringtone, settings.keepRinging)
    setOvertimeMode(currentModeRef.current)
    setOvertimeStart(Date.now())
    pendingSessionRef.current = {
      mode: finishedMode,
      plannedSeconds,
      activeSeconds: plannedSeconds,
      completed: true,
    }
    markRingingRef.current()
  }, [
    settings.ringtone,
    settings.keepRinging,
    settings.autoStartNext,
    durationFor,
  ])

  const { status, remaining, start, pause, resetTo, markRinging } = useTimer({
    durationSeconds,
    mode: currentMode,
    onComplete: handleComplete,
  })

  useEffect(() => {
    markRingingRef.current = markRinging
  }, [markRinging])

  useEffect(() => {
    if (!autoStartPendingRef.current) return
    autoStartPendingRef.current = false
    resetTo(durationFor(currentMode))
    activeAccumRef.current = 0
    activeStartRef.current = Date.now()
    start()
    // autoStartTrigger/currentMode are the triggers; the rest are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartTrigger, currentMode])

  useEffect(() => {
    const unsub = audioManager.subscribe((playing, blocked) => {
      setAudioBlocked(blocked)
      if (!playing) setIsPreviewing(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    audioManager.setVolume(settings.volume)
  }, [settings.volume])

  useEffect(() => {
    if (overtimeStart === null) return
    const tick = () => setOvertimeSeconds((Date.now() - overtimeStart) / 1000)
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [overtimeStart])

  const overtimeAddRef = useRef(overtimeLog.add)
  useEffect(() => {
    overtimeAddRef.current = overtimeLog.add
  }, [overtimeLog.add])

  const commitOvertime = useCallback(() => {
    setOvertimeStart((start) => {
      if (start !== null) {
        const overtimeSecs = (Date.now() - start) / 1000
        overtimeAddRef.current(overtimeMode, overtimeSecs)
        const pending = pendingSessionRef.current
        if (pending) {
          recordSessionRef.current({
            mode: pending.mode,
            plannedSeconds: pending.plannedSeconds,
            activeSeconds: pending.activeSeconds,
            overtimeSeconds: overtimeSecs,
            completed: pending.completed,
          })
        }
      }
      pendingSessionRef.current = null
      return null
    })
    setOvertimeSeconds(0)
  }, [overtimeMode])

  const dismissOvertime = useCallback(() => {
    const pending = pendingSessionRef.current
    if (pending) {
      recordSessionRef.current({
        mode: pending.mode,
        plannedSeconds: pending.plannedSeconds,
        activeSeconds: pending.activeSeconds,
        overtimeSeconds: 0,
        completed: pending.completed,
      })
      pendingSessionRef.current = null
    }
    setOvertimeStart(null)
    setOvertimeSeconds(0)
  }, [])

  const currentActiveSeconds = useCallback(() => {
    let secs = activeAccumRef.current
    if (activeStartRef.current !== null) {
      secs += (Date.now() - activeStartRef.current) / 1000
    }
    return secs
  }, [])

  const clearActiveTracking = useCallback(() => {
    activeStartRef.current = null
    activeAccumRef.current = 0
  }, [])

  const recordPartialIfRunning = useCallback(() => {
    if (status !== 'RUNNING' && status !== 'PAUSED') {
      clearActiveTracking()
      return
    }
    const active = currentActiveSeconds()
    clearActiveTracking()
    if (active < 1) return
    recordSessionRef.current({
      mode: currentModeRef.current,
      plannedSeconds: durationFor(currentModeRef.current),
      activeSeconds: active,
      overtimeSeconds: 0,
      completed: false,
    })
  }, [status, currentActiveSeconds, clearActiveTracking, durationFor])

  const {
    permission: notificationPermission,
    requestPermission,
    notify,
  } = useIdleNotifications({
    enabled: settings.idleReminderEnabled,
    intervalMinutes: settings.idleReminderInterval,
    message: settings.idleReminderMessage,
    funny: settings.idleReminderFunny,
    timerRunning: status === 'RUNNING',
  })

  useEffect(() => {
    sessionEndReminderRef.current = (finishedMode: TimerMode) => {
      if (!settings.idleReminderEnabled) return
      if (!settings.remindOnSessionEnd) return
      const body = settings.idleReminderFunny
        ? undefined
        : finishedMode === 'pomodoro'
          ? 'Pomodoro complete. Time for a well-earned break.'
          : 'Break over. Ready for the next pomodoro?'
      notify(body)
    }
  }, [
    settings.idleReminderEnabled,
    settings.remindOnSessionEnd,
    settings.idleReminderFunny,
    notify,
  ])

  const timerRunning = status === 'RUNNING'
  useEffect(() => {
    if (!settings.idleSoundEnabled) return
    if (timerRunning) return
    const ms = Math.max(1, settings.idleReminderInterval) * 60 * 1000
    const id = window.setInterval(() => audioManager.idleChime(), ms)
    return () => window.clearInterval(id)
  }, [settings.idleSoundEnabled, settings.idleReminderInterval, timerRunning])

  const handlePreviewIdleSound = useCallback(() => {
    audioManager.init()
    audioManager.idleChime()
  }, [])

  const setPendingMode = useCallback((m: TimerMode | null) => {
    pendingModeRef.current = m
  }, [])

  useEffect(() => {
    advanceRef.current = () => {
      let nextMode: TimerMode
      if (currentMode === 'pomodoro') {
        const next = completedPomodoros + 1
        setCompletedPomodoros(next)
        const goLong = next % settings.pomodorosBeforeLongBreak === 0
        nextMode = goLong ? 'longBreak' : 'shortBreak'
      } else {
        nextMode = 'pomodoro'
      }
      pendingModeRef.current = settings.autoCycle ? nextMode : currentMode
    }
  }, [
    currentMode,
    completedPomodoros,
    settings.pomodorosBeforeLongBreak,
    settings.autoCycle,
  ])

  const handleModeChange = useCallback(
    (m: TimerMode) => {
      if (status === 'RINGING' || status === 'COMPLETED') {
        audioManager.stop()
      }
      recordPartialIfRunning()
      commitOvertime()
      setPendingMode(null)
      setCurrentMode(m)
      resetTo(durationFor(m))
    },
    [status, recordPartialIfRunning, commitOvertime, setPendingMode, resetTo, durationFor],
  )

  const handleSelectTemplate = useCallback(
    (template: Template) => {
      applyTemplate(template)
      recordPartialIfRunning()
      commitOvertime()
      setPendingMode(null)
      setCurrentMode('pomodoro')
      resetTo(template.pomodoroDuration * 60)
    },
    [applyTemplate, recordPartialIfRunning, commitOvertime, setPendingMode, resetTo],
  )

  const handleStart = useCallback(() => {
    audioManager.init()
    pressFeedback('start')
    commitOvertime()
    if (status !== 'RUNNING') activeStartRef.current = Date.now()
    start()
  }, [commitOvertime, status, start])

  const handlePause = useCallback(() => {
    pressFeedback('stop')
    if (activeStartRef.current !== null) {
      activeAccumRef.current += (Date.now() - activeStartRef.current) / 1000
      activeStartRef.current = null
    }
    pause()
  }, [pause])

  const handleStopRinging = useCallback(() => {
    pressFeedback('stop')
    audioManager.stop()
    const nextMode = pendingModeRef.current ?? currentMode
    setPendingMode(null)
    setCurrentMode(nextMode)
    resetTo(durationFor(nextMode))
  }, [currentMode, setPendingMode, resetTo, durationFor])

  const handleSkip = useCallback(() => {
    pressFeedback('start')
    if (status === 'RINGING' || status === 'COMPLETED') {
      audioManager.stop()
    }
    recordPartialIfRunning()
    commitOvertime()
    setPendingMode(null)
    if (currentMode === 'pomodoro') {
      const next = completedPomodoros + 1
      setCompletedPomodoros(next)
      const goLong = next % settings.pomodorosBeforeLongBreak === 0
      const nextMode: TimerMode = goLong ? 'longBreak' : 'shortBreak'
      setCurrentMode(nextMode)
      resetTo(durationFor(nextMode))
    } else {
      setCurrentMode('pomodoro')
      resetTo(durationFor('pomodoro'))
    }
  }, [
    status,
    recordPartialIfRunning,
    commitOvertime,
    setPendingMode,
    currentMode,
    completedPomodoros,
    settings.pomodorosBeforeLongBreak,
    resetTo,
    durationFor,
  ])

  const handleReset = useCallback(() => {
    pressFeedback('stop')
    if (status === 'RINGING' || status === 'COMPLETED') {
      audioManager.stop()
    }
    recordPartialIfRunning()
    commitOvertime()
    setPendingMode(null)
    resetTo(durationFor(currentMode))
  }, [status, recordPartialIfRunning, commitOvertime, setPendingMode, resetTo, durationFor, currentMode])

  const handlePreview = useCallback((ringtone: RingtoneId) => {
    audioManager.init()
    setIsPreviewing(true)
    audioManager.preview(ringtone)
  }, [])

  const handleStopPreview = useCallback(() => {
    audioManager.stop()
    setIsPreviewing(false)
  }, [])

  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0

  const pool = settings.pomodorosBeforeLongBreak
  const inCycle = completedPomodoros % pool
  const filledDots =
    currentMode === 'pomodoro' ? inCycle : inCycle === 0 ? pool : inCycle
  const sessionNumber = currentMode === 'pomodoro' ? inCycle + 1 : filledDots

  return useMemo<TimerEngine>(
    () => ({
      settings,
      update,
      reset,
      applyTemplate,
      applyCustom,
      currentMode,
      status,
      remaining,
      durationSeconds,
      progress,
      isBreak,
      completedPomodoros,
      sessionNumber,
      filledDots,
      pool,
      overtimeStart,
      overtimeSeconds,
      overtimeMode,
      overtimeLog,
      audioBlocked,
      setAudioBlocked,
      isPreviewing,
      notificationPermission,
      requestPermission,
      handleStart,
      handlePause,
      handleReset,
      handleSkip,
      handleStopRinging,
      handleModeChange,
      handleSelectTemplate,
      dismissOvertime,
      handlePreview,
      handleStopPreview,
      handlePreviewIdleSound,
    }),
    [
      settings,
      update,
      reset,
      applyTemplate,
      applyCustom,
      currentMode,
      status,
      remaining,
      durationSeconds,
      progress,
      isBreak,
      completedPomodoros,
      sessionNumber,
      filledDots,
      pool,
      overtimeStart,
      overtimeSeconds,
      overtimeMode,
      overtimeLog,
      audioBlocked,
      isPreviewing,
      notificationPermission,
      requestPermission,
      handleStart,
      handlePause,
      handleReset,
      handleSkip,
      handleStopRinging,
      handleModeChange,
      handleSelectTemplate,
      dismissOvertime,
      handlePreview,
      handleStopPreview,
      handlePreviewIdleSound,
    ],
  )
}
