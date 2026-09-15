import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Stack,
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Alert,
  useMediaQuery,
  Drawer,
} from '@mui/material'
import { createAppTheme } from './theme/createAppTheme'
import { useSettings } from './hooks/useSettings'
import { useTimer } from './hooks/useTimer'
import { useResolvedMode } from './hooks/useResolvedMode'
import { audioManager } from './audio/AudioManager'
import { pressFeedback } from './audio/feedback'
import Navbar from './components/Navbar'
import ModeTabs from './components/ModeTabs'
import TimerDial from './components/TimerDial'
import Controls from './components/Controls'
import SessionIndicator from './components/SessionIndicator'
import SettingsPanel from './components/SettingsPanel'
import SetupScreen from './components/SetupScreen'
import TemplateSummary from './components/TemplateSummary'
import { formatTime } from './utils'
import type { Template } from './templates'
import type { RingtoneId, TimerMode } from './types'

const STATUS_LABELS: Record<string, string> = {
  IDLE: 'Ready to focus?',
  RUNNING: 'Stay focused',
  PAUSED: 'Paused',
  COMPLETED: "Time's up!",
  RINGING: "Time's up!",
}

const BREAK_STATUS: Record<string, string> = {
  IDLE: 'Time for a break',
  RUNNING: 'Enjoy your break',
  PAUSED: 'Paused',
}

function App() {
  const { settings, update, reset, applyTemplate, applyCustom, hasChosenTemplate } =
    useSettings()
  const mode = useResolvedMode(settings.themeMode)
  const theme = useMemo(
    () => createAppTheme(mode, settings.accentColor),
    [mode, settings.accentColor],
  )
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  // The side-by-side (dial | controls) layout is used only in the lg range;
  // xl and up revert to the roomy centered column.
  const isSideBySide = useMediaQuery(theme.breakpoints.between('lg', 'xl'))

  const [currentMode, setCurrentMode] = useState<TimerMode>('pomodoro')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState(false)

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
    [settings.pomodoroDuration, settings.shortBreakDuration, settings.longBreakDuration],
  )

  const durationSeconds = durationFor(currentMode)

  // Determine the next mode based on cycling rules.
  const advanceRef = useRef<() => void>(() => {})

  const markRingingRef = useRef<() => void>(() => {})

  const handleComplete = useCallback(() => {
    audioManager.play(settings.ringtone, settings.keepRinging)
    // Enter the RINGING state and keep it visible until the user acknowledges
    // by stopping the sound. The actual mode transition is applied then.
    markRingingRef.current()
    advanceRef.current()
  }, [settings.ringtone, settings.keepRinging])

  const { status, remaining, start, pause, resetTo, markRinging } =
    useTimer({
      durationSeconds,
      mode: currentMode,
      onComplete: handleComplete,
    })

  useEffect(() => {
    markRingingRef.current = markRinging
  }, [markRinging])

  // Subscribe to audio manager state (playing / blocked).
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

  // The mode the timer will move to once the completed session is acknowledged.
  const pendingModeRef = useRef<TimerMode | null>(null)

  // Auto-cycle logic. On completion we compute the next mode and stash it; the
  // count of finished pomodoros is updated immediately so the session dots and
  // long-break scheduling stay correct.
  useEffect(() => {
    advanceRef.current = () => {
      let nextMode: TimerMode
      if (currentMode === 'pomodoro') {
        const next = completedPomodoros + 1
        setCompletedPomodoros(next)
        const goLong = next % settings.pomodorosBeforeLongBreak === 0
        nextMode = goLong ? 'longBreak' : 'shortBreak'
      } else {
        // A break just finished -> back to pomodoro.
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

  const handleModeChange = (m: TimerMode) => {
    if (status === 'RINGING' || status === 'COMPLETED') {
      audioManager.stop()
    }
    pendingModeRef.current = null
    setCurrentMode(m)
    resetTo(durationFor(m))
  }

  const handleSelectTemplate = (template: Template) => {
    applyTemplate(template)
    // Reset the running view to the newly chosen pomodoro length.
    pendingModeRef.current = null
    setCurrentMode('pomodoro')
    resetTo(template.pomodoroDuration * 60)
  }

  const handleStart = () => {
    // Starting counts as a user gesture -> initialize audio for later playback.
    audioManager.init()
    pressFeedback('start')
    start()
  }

  const handlePause = () => {
    pressFeedback('stop')
    pause()
  }

  const handleStopRinging = () => {
    pressFeedback('stop')
    audioManager.stop()
    const nextMode = pendingModeRef.current ?? currentMode
    pendingModeRef.current = null
    setCurrentMode(nextMode)
    resetTo(durationFor(nextMode))
  }

  const handleSkip = () => {
    pressFeedback('start')
    if (status === 'RINGING' || status === 'COMPLETED') {
      audioManager.stop()
    }
    pendingModeRef.current = null
    // Move to next session according to cycling behaviour.
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
  }

  const handleReset = () => {
    pressFeedback('stop')
    if (status === 'RINGING' || status === 'COMPLETED') {
      audioManager.stop()
    }
    pendingModeRef.current = null
    resetTo(durationFor(currentMode))
  }

  const handlePreview = (ringtone: RingtoneId) => {
    audioManager.init()
    setIsPreviewing(true)
    audioManager.preview(ringtone)
  }

  const handleStopPreview = () => {
    audioManager.stop()
    setIsPreviewing(false)
  }

  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0
  const statusLabel =
    currentMode === 'pomodoro'
      ? STATUS_LABELS[status]
      : BREAK_STATUS[status] ?? STATUS_LABELS[status]

  const pool = settings.pomodorosBeforeLongBreak
  // How many pomodoros completed within the current cycle (0..pool).
  const inCycle = completedPomodoros % pool
  // On a pomodoro we're working on the (inCycle + 1)-th; on a break we've just
  // finished the inCycle-th (or the full pool for a long break).
  const filledDots =
    currentMode === 'pomodoro' ? inCycle : inCycle === 0 ? pool : inCycle
  const sessionNumber =
    currentMode === 'pomodoro' ? inCycle + 1 : filledDots

  const dial = (
    <TimerDial
      progress={progress}
      timeLabel={formatTime(remaining)}
      statusLabel={statusLabel}
      isBreak={isBreak}
    />
  )

  const controls = (
    <Controls
      status={status}
      onStart={handleStart}
      onPause={handlePause}
      onReset={handleReset}
      onSkip={handleSkip}
      onStopRinging={handleStopRinging}
    />
  )

  const sessionDots = (
    <SessionIndicator label={sessionNumber} filled={filledDots} total={pool} />
  )

  const modeTabs = <ModeTabs mode={currentMode} onChange={handleModeChange} />
  const summary = <TemplateSummary settings={settings} />

  const timerContent = isSideBySide ? (
    // lg only: tabs as a clean header on top, then a centered row of
    // [dial | side panel]. The side panel groups the format summary with the
    // controls and session dots so the right column feels balanced and the
    // top isn't a cramped two-tier block.
    <Box
      sx={{
        px: 4,
        py: 3,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(32px, 8vh, 72px)',
      }}
    >
      <Box sx={{ flexShrink: 0 }}>{modeTabs}</Box>

      <Box
        sx={{
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { lg: 7 },
        }}
      >
        {/* Dial: fits the available row height, capped at its design size. */}
        <Box
          sx={{
            height: 'min(44vh, 340px)',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            containerType: 'size',
            flexShrink: 0,
          }}
        >
          <TimerDial
            progress={progress}
            timeLabel={formatTime(remaining)}
            statusLabel={statusLabel}
            isBreak={isBreak}
            fitContainer
          />
        </Box>

        {/* Side panel: format summary + controls + session dots. */}
        <Stack
          spacing={2.5}
          sx={{ flexShrink: 0, alignItems: 'center', width: 320 }}
        >
          {summary}
          {controls}
          {sessionDots}
        </Stack>
      </Box>
    </Box>
  ) : (
    // Small screens: single centered column.
    <Stack
      sx={{
        px: { xs: 2, sm: 4 },
        flexShrink: 0,
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        alignItems: 'center',
      }}
    >
      <Stack spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
        {modeTabs}
        {summary}
      </Stack>
      <Box sx={{ my: 'clamp(16px, 4vh, 40px)' }}>{dial}</Box>
      <Stack spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%', alignItems: 'center' }}>
        {controls}
        {sessionDots}
      </Stack>
    </Stack>
  )

  if (!hasChosenTemplate) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SetupScreen onSelect={handleSelectTemplate} onCustom={applyCustom} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100svh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((o) => !o)}
        />

        {/* Content area fills the remaining height and centers the timer. The
            dial scales to the viewport (see TimerDial) so everything fits
            without scrolling. */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: 1200,
            width: '100%',
            mx: 'auto',
            py: { xs: 1.5, md: 3 },
          }}
        >
          {timerContent}
        </Box>

        <Drawer
          anchor={isDesktop ? 'right' : 'bottom'}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          slotProps={{
            paper: {
              sx: {
                width: isDesktop ? 520 : '100%',
                maxWidth: isDesktop ? '92vw' : '100%',
                height: isDesktop ? '100%' : 'auto',
                maxHeight: isDesktop ? '100%' : '88svh',
                borderTopLeftRadius: isDesktop ? 0 : 20,
                borderTopRightRadius: isDesktop ? 0 : 20,
                borderLeft: isDesktop ? 1 : 0,
                borderColor: 'divider',
              },
            },
          }}
        >
          {/* Bottom-sheet grab handle on mobile */}
          {!isDesktop && (
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                bgcolor: 'divider',
                mx: 'auto',
                mt: 1.5,
                mb: -1,
              }}
            />
          )}
          <SettingsPanel
            settings={settings}
            onUpdate={update}
            onReset={reset}
            onApplyTemplate={handleSelectTemplate}
            onSelectCustom={() => applyCustom()}
            onClose={() => setSettingsOpen(false)}
            onPreview={handlePreview}
            onStopPreview={handleStopPreview}
            isPreviewing={isPreviewing}
          />
        </Drawer>
      </Box>

      <Snackbar
        open={audioBlocked}
        autoHideDuration={6000}
        onClose={() => setAudioBlocked(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setAudioBlocked(false)}>
          Audio is blocked by your browser. Interact with the page (e.g. start
          the timer) to enable sound.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App
