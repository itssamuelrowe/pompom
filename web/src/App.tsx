import { lazy, Suspense, useMemo } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  Box,
  Stack,
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { createAppTheme } from './theme/createAppTheme'
import { useSettings } from './hooks/useSettings'
import { useResolvedMode } from './hooks/useResolvedMode'
import { TimerProvider } from './timer/TimerContext'
import { useTimerContext } from './timer/context'
import Navbar from './components/Navbar'
import ModeTabs from './components/ModeTabs'
import TimerDial from './components/TimerDial'
import Controls from './components/Controls'
import SessionIndicator from './components/SessionIndicator'
import SettingsPanel from './components/SettingsPanel'
import SetupScreen from './components/SetupScreen'
import TemplateSummary from './components/TemplateSummary'
import OvertimeCounter from './components/OvertimeCounter'
import OvertimeHistoryDialog from './components/OvertimeHistoryDialog'
import MiniTimer from './components/MiniTimer'
import StreakSection from './components/StreakSection'
import WhyBuilt from './components/WhyBuilt'
import { formatTime } from './utils'

// The analytics page pulls in visx + d3, so it's code-split and only loaded
// when the user actually navigates there. Keeps the timer's first paint lean.
const AnalyticsPage = lazy(() => import('./components/AnalyticsPage'))

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

/** The full timer page. All state comes from the shared timer context. */
function TimerScreen() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isSideBySide = useMediaQuery(theme.breakpoints.between('lg', 'xl'))

  const {
    settings,
    currentMode,
    status,
    remaining,
    progress,
    isBreak,
    sessionNumber,
    filledDots,
    pool,
    settingsOpen,
    setSettingsOpen,
    setHistoryOpen,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleStopRinging,
    handleModeChange,
  } = useTimerContext()

  const statusLabel =
    currentMode === 'pomodoro'
      ? STATUS_LABELS[status]
      : BREAK_STATUS[status] ?? STATUS_LABELS[status]

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
    // [dial | side panel].
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

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((o) => !o)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenAnalytics={() => navigate('/analytics')}
      />

      {/* Timer hero: fills the viewport below the toolbar and centers the dial,
          so the first screen is still a focused, scroll-free timer. */}
      <Box
        sx={{
          position: 'relative',
          minHeight: 'calc(100svh - 64px)',
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

        {/* Scroll cue: hints there's more below the fold. */}
        <Tooltip title="More below" arrow placement="top">
          <IconButton
            aria-label="Scroll down to see more"
            onClick={() =>
              document
                .getElementById('below-the-fold')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            sx={{
              position: 'absolute',
              bottom: { xs: 10, md: 16 },
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'text.secondary',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '@keyframes pompom-scroll-bob': {
                '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
                '50%': { transform: 'translateX(-50%) translateY(6px)' },
              },
              animation: 'pompom-scroll-bob 1.8s ease-in-out infinite',
              '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <KeyboardArrowDownRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Below the fold: streaks + the author's note. Scroll to reveal. */}
      <Box
        id="below-the-fold"
        component="section"
        sx={{
          scrollMarginTop: 72,
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          pb: { xs: 6, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 3 },
        }}
      >
        <StreakSection />
        <WhyBuilt />
      </Box>
    </Box>
  )
}

/**
 * App-wide timer surfaces that must persist across routes: the settings
 * drawer, overtime history dialog, the floating overtime counter, the audio
 * snackbar, and the mini timer. Rendered once, above the routes.
 */
function SharedTimerChrome() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const location = useLocation()

  const {
    settings,
    update,
    reset,
    applyCustom,
    overtimeStart,
    overtimeSeconds,
    overtimeMode,
    overtimeLog,
    audioBlocked,
    setAudioBlocked,
    isPreviewing,
    notificationPermission,
    requestPermission,
    handleSelectTemplate,
    dismissOvertime,
    handlePreview,
    handleStopPreview,
    handlePreviewIdleSound,
    settingsOpen,
    setSettingsOpen,
    historyOpen,
    setHistoryOpen,
  } = useTimerContext()

  // The mini timer appears on every route except the main timer page.
  const showMiniTimer = location.pathname !== '/'

  return (
    <>
      {showMiniTimer && <MiniTimer />}

      <Drawer
        anchor={isDesktop ? 'right' : 'bottom'}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: isDesktop ? 680 : '100%',
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
          notificationPermission={notificationPermission}
          onRequestNotificationPermission={requestPermission}
          onPreviewIdleSound={handlePreviewIdleSound}
        />
      </Drawer>

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

      {overtimeStart !== null && (
        <OvertimeCounter
          seconds={overtimeSeconds}
          mode={overtimeMode}
          onDismiss={dismissOvertime}
        />
      )}

      <OvertimeHistoryDialog
        open={historyOpen}
        entries={overtimeLog.entries}
        onClose={() => setHistoryOpen(false)}
        onRemove={overtimeLog.remove}
        onClear={overtimeLog.clear}
      />
    </>
  )
}

/** Minimal placeholder shown while the analytics chunk loads. */
function AnalyticsFallback() {
  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress />
    </Box>
  )
}

/** Routed content, rendered inside the timer provider. */
function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<TimerScreen />} />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<AnalyticsFallback />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SharedTimerChrome />
    </>
  )
}

/**
 * Application root: owns the single settings source of truth, builds the MUI
 * theme from it, and hosts the timer engine above the router so the session
 * (and the mini timer) persists across navigation. The first-run setup gate
 * still takes precedence over any route.
 */
function App() {
  const { settings, update, reset, applyTemplate, applyCustom, hasChosenTemplate } =
    useSettings()
  const mode = useResolvedMode(settings.themeMode)
  const theme = useMemo(
    () => createAppTheme(mode, settings.accentColor),
    [mode, settings.accentColor],
  )

  const settingsApi = useMemo(
    () => ({ settings, update, reset, applyTemplate, applyCustom }),
    [settings, update, reset, applyTemplate, applyCustom],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        {!hasChosenTemplate ? (
          <SetupScreen onSelect={applyTemplate} onCustom={applyCustom} />
        ) : (
          <TimerProvider settingsApi={settingsApi}>
            <AppRoutes />
          </TimerProvider>
        )}
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
