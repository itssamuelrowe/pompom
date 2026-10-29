import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { useEffect, useRef, useState } from 'react'
import {
  DURATION_LIMITS,
  IDLE_REMINDER_MESSAGE_MAX,
  REMINDER_INTERVAL_LIMITS,
} from '../defaults'
import { type Settings, type ThemeMode, type RingtoneId } from '../types'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { RINGTONES } from '../audio/ringtones'
import { getAccentColor } from '../theme/palette'
import {
  CUSTOM_TEMPLATE_ID,
  TEMPLATES,
  matchTemplate,
  type Template,
} from '../templates'
import AccentColorPicker from './AccentColorPicker'
import NumberStepper from './NumberStepper'
import TemplateCard from './TemplateCard'

// A tighter corner radius for the interactive "option" controls so they read
// as crisp rows rather than pill-like blobs.
const OPTION_RADIUS = '8px'

interface SettingsPanelProps {
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReset: () => void
  onApplyTemplate: (template: Template) => void
  onSelectCustom: () => void
  onClose: () => void
  onPreview: (ringtone: RingtoneId) => void
  onStopPreview: () => void
  isPreviewing: boolean
  /** Current browser notification permission state. */
  notificationPermission: 'default' | 'granted' | 'denied' | 'unsupported'
  /** Ask the browser for notification permission (user gesture). */
  onRequestNotificationPermission: () => void
  /** Play the two-beat idle sound once (also unlocks audio). */
  onPreviewIdleSound: () => void
}

function SectionLabel({
  children,
  id,
}: {
  children: React.ReactNode
  id?: string
}) {
  return (
    <Typography
      id={id}
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontWeight: 700,
        letterSpacing: 1,
        display: 'block',
        mb: 1,
        // Offset so the sticky header doesn't cover the target on scroll.
        scrollMarginTop: 80,
      }}
    >
      {children}
    </Typography>
  )
}

interface OptionRowProps {
  active?: boolean
  onSelect: () => void
  title: string
  subtitle: string
  ariaLabel: string
  icon?: React.ReactNode
}

/** A selectable settings row with a crisp (not pill-like) corner radius. */
function OptionRow({
  active = false,
  onSelect,
  title,
  subtitle,
  ariaLabel,
  icon,
}: OptionRowProps) {
  const theme = useTheme()
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-pressed={active}
      aria-label={ariaLabel}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.5,
        py: 1.1,
        borderRadius: OPTION_RADIUS,
        border: 1,
        cursor: 'pointer',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active
          ? alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      {icon && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: '6px',
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active
              ? alpha(theme.palette.primary.main, 0.14)
              : 'action.hover',
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      </Box>
      {active && (
        <CheckRoundedIcon
          fontSize="small"
          sx={{ color: 'primary.main', flexShrink: 0 }}
        />
      )}
    </Box>
  )
}

interface NotificationPermissionStatusProps {
  permission: 'default' | 'granted' | 'denied' | 'unsupported'
  onRequest: () => void
}

/**
 * Shows the current browser notification permission and, when it isn't granted,
 * a clear way to request it (or guidance when it's been blocked/unsupported).
 */
function NotificationPermissionStatus({
  permission,
  onRequest,
}: NotificationPermissionStatusProps) {
  const theme = useTheme()

  const config = {
    granted: {
      color: theme.palette.success.main,
      icon: <NotificationsActiveRoundedIcon fontSize="small" />,
      title: 'Notifications enabled',
      detail: "You'll get reminders while this tab is open.",
    },
    default: {
      color: theme.palette.warning.main,
      icon: <ErrorOutlineRoundedIcon fontSize="small" />,
      title: 'Permission needed',
      detail: 'Allow notifications so reminders can show up.',
    },
    denied: {
      color: theme.palette.error.main,
      icon: <NotificationsOffRoundedIcon fontSize="small" />,
      title: 'Notifications blocked',
      detail:
        "Your browser is blocking them. Allow notifications for this site in the address-bar / site settings, then try again.",
    },
    unsupported: {
      color: theme.palette.error.main,
      icon: <NotificationsOffRoundedIcon fontSize="small" />,
      title: 'Not supported',
      detail: "This browser doesn't support notifications.",
    },
  }[permission]

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.25,
        p: 1.25,
        borderRadius: OPTION_RADIUS,
        border: 1,
        borderColor: alpha(config.color, 0.4),
        bgcolor: alpha(config.color, 0.06),
      }}
    >
      <Box sx={{ color: config.color, display: 'flex', mt: 0.1 }}>
        {config.icon}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {config.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {config.detail}
        </Typography>
      </Box>
      {(permission === 'default' || permission === 'denied') && (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={onRequest}
          sx={{
            flexShrink: 0,
            color: 'text.primary',
            borderColor: 'divider',
            borderRadius: OPTION_RADIUS,
            whiteSpace: 'nowrap',
          }}
        >
          {permission === 'denied' ? 'Try again' : 'Allow'}
        </Button>
      )}
    </Box>
  )
}

const SETTINGS_SECTIONS = [
  { id: 'settings-format', label: 'Format' },
  { id: 'settings-sound', label: 'Sound' },
  { id: 'settings-behavior', label: 'Behavior' },
  { id: 'settings-reminders', label: 'Reminders' },
  { id: 'settings-appearance', label: 'Appearance' },
  { id: 'settings-data', label: 'Data' },
] as const

interface SettingsQuickNavProps {
  /** The scrollable content container the section anchors live in. */
  scrollRef: React.RefObject<HTMLDivElement | null>
}

/**
 * A sticky vertical rail (desktop only) that jumps to each settings section
 * and highlights the one currently in view.
 */
function SettingsQuickNav({ scrollRef }: SettingsQuickNavProps) {
  const theme = useTheme()
  const [active, setActive] = useState<string>(SETTINGS_SECTIONS[0].id)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the top-most section currently intersecting the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActive(visible[0].target.id)
      },
      { root, rootMargin: '-65px 0px -70% 0px', threshold: 0 },
    )
    for (const s of SETTINGS_SECTIONS) {
      const el = root.querySelector(`#${s.id}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [scrollRef])

  const go = (id: string) => {
    const root = scrollRef.current
    const el = root?.querySelector<HTMLElement>(`#${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <Box
      component="nav"
      aria-label="Settings sections"
      sx={{
        flexShrink: 0,
        width: 150,
        borderLeft: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 65,
        alignSelf: 'flex-start',
        pt: 3,
        pb: 3,
        pl: 1.5,
        pr: 2,
      }}
    >
      <Stack spacing={0.25}>
        {SETTINGS_SECTIONS.map((s) => {
          const isActive = active === s.id
          return (
            <Box
              key={s.id}
              component="button"
              onClick={() => go(s.id)}
              aria-current={isActive ? 'true' : undefined}
              sx={{
                appearance: 'none',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
                borderRadius: '8px',
                px: 1.25,
                py: 0.75,
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'primary.main' : 'text.secondary',
                bgcolor: isActive
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
                transition: 'background-color 0.15s, color 0.15s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  color: 'text.primary',
                },
              }}
            >
              {s.label}
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

export default function SettingsPanel({
  settings,
  onUpdate,
  onReset,
  onApplyTemplate,
  onSelectCustom,
  onClose,
  onPreview,
  onStopPreview,
  isPreviewing,
  notificationPermission,
  onRequestNotificationPermission,
  onPreviewIdleSound,
}: SettingsPanelProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const scrollRef = useRef<HTMLDivElement>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const accent = getAccentColor(settings.accentColor)
  const swatch = theme.palette.mode === 'dark' ? accent.darkMain : accent.main
  // The template whose durations currently match the settings, if any.
  const activeTemplate = matchTemplate(settings)
  // Treat the format as custom when the user explicitly chose Custom or when
  // the durations don't line up with any template. The duration form (below)
  // is only revealed in this state.
  const isCustom =
    settings.templateId === CUSTOM_TEMPLATE_ID || !activeTemplate

  return (
    // The whole panel is one scroll container, so the scrollbar sits on the
    // drawer's right edge. Content and the sticky quick-nav share this scroll
    // context; the nav just pins itself with position: sticky.
    <Box
      ref={scrollRef}
      sx={{ height: '100%', overflowY: 'auto' }}
    >
      {/* Sticky header spans the full panel width and pins to the top. */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, sm: 4 },
          py: 2,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h5">Settings</Typography>
        <IconButton onClick={onClose} aria-label="Close settings" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: { xs: 3, sm: 4 },
            py: { xs: 3, sm: 3.5 },
          }}
        >
      {/* Format templates — same rich cards as the first-run setup screen. */}
      <SectionLabel id="settings-format">Format</SectionLabel>
      <Stack spacing={1} sx={{ mb: isCustom ? 2 : 3 }}>
        {TEMPLATES.map((t) => {
          const active = !isCustom && activeTemplate?.id === t.id
          return (
            <TemplateCard
              key={t.id}
              template={t}
              active={active}
              onSelect={onApplyTemplate}
              trailing={
                active ? (
                  <CheckRoundedIcon
                    fontSize="small"
                    sx={{ color: 'primary.main' }}
                  />
                ) : undefined
              }
            />
          )
        })}

        {/* Custom row — selecting it reveals the duration form below. */}
        <OptionRow
          active={isCustom}
          onSelect={onSelectCustom}
          ariaLabel="Custom format — set your own durations"
          title="Custom"
          subtitle="Set your own durations"
          icon={<TuneRoundedIcon fontSize="small" />}
        />
      </Stack>

      {/* Duration form: only shown for the custom format. */}
      {isCustom && (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <NumberStepper
            label="Pomodoro"
            value={settings.pomodoroDuration}
            min={DURATION_LIMITS.min}
            max={DURATION_LIMITS.max}
            suffix="min"
            onChange={(v) => onUpdate('pomodoroDuration', v)}
          />
          <NumberStepper
            label="Short break"
            value={settings.shortBreakDuration}
            min={DURATION_LIMITS.min}
            max={DURATION_LIMITS.max}
            suffix="min"
            onChange={(v) => onUpdate('shortBreakDuration', v)}
          />
          <NumberStepper
            label="Long break"
            value={settings.longBreakDuration}
            min={DURATION_LIMITS.min}
            max={DURATION_LIMITS.max}
            suffix="min"
            onChange={(v) => onUpdate('longBreakDuration', v)}
          />
          <NumberStepper
            label="Pomodoros before long break"
            value={settings.pomodorosBeforeLongBreak}
            min={DURATION_LIMITS.poolMin}
            max={DURATION_LIMITS.poolMax}
            onChange={(v) => onUpdate('pomodorosBeforeLongBreak', v)}
          />
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Sound */}
      <SectionLabel id="settings-sound">Sound</SectionLabel>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Ringtone"
          value={settings.ringtone}
          onChange={(e) => {
            const next = e.target.value as RingtoneId
            onUpdate('ringtone', next)
            // If a preview is already playing, immediately switch to the newly
            // selected tone so the user hears their choice right away.
            if (isPreviewing) onPreview(next)
          }}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: OPTION_RADIUS } }}
        >
          {RINGTONES.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.name}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={isPreviewing ? <StopRoundedIcon /> : <PlayArrowRoundedIcon />}
            onClick={() =>
              isPreviewing ? onStopPreview() : onPreview(settings.ringtone)
            }
            sx={{ color: 'text.secondary', borderColor: 'divider', borderRadius: OPTION_RADIUS }}
          >
            {isPreviewing ? 'Stop' : 'Preview'}
          </Button>
          <VolumeUpRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Slider
            value={settings.volume}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, v) => onUpdate('volume', v as number)}
            aria-label="Volume"
            sx={{ flex: 1 }}
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={settings.keepRinging}
              onChange={(e) => onUpdate('keepRinging', e.target.checked)}
            />
          }
          label="Keep ringing until stopped"
          sx={{ justifyContent: 'space-between', ml: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
          labelPlacement="start"
        />
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Behavior */}
      <SectionLabel id="settings-behavior">Behavior</SectionLabel>
      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoCycle}
              onChange={(e) => onUpdate('autoCycle', e.target.checked)}
            />
          }
          label="Auto-cycle sessions"
          sx={{ justifyContent: 'space-between', ml: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
          labelPlacement="start"
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          Automatically switch between pomodoro, short break and long break.
        </Typography>
      </Box>

      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoStartNext}
              onChange={(e) => onUpdate('autoStartNext', e.target.checked)}
            />
          }
          label="Auto-start next timer"
          sx={{ justifyContent: 'space-between', ml: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
          labelPlacement="start"
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          Start the next session automatically when one finishes, without
          clicking any buttons.
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Reminders — notify the user while the timer is idle. */}
      <SectionLabel id="settings-reminders">Reminders</SectionLabel>
      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.idleReminderEnabled}
              onChange={(e) => {
                const on = e.target.checked
                onUpdate('idleReminderEnabled', on)
                // Turning the reminder on is a user gesture -> good moment to
                // ask for notification permission if we don't have it yet.
                if (on && notificationPermission === 'default') {
                  onRequestNotificationPermission()
                }
              }}
              disabled={notificationPermission === 'unsupported'}
            />
          }
          label="Idle reminders"
          sx={{ justifyContent: 'space-between', ml: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
          labelPlacement="start"
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          While PomPom is open and the timer isn't running, send a notification
          to nudge you back to focus.
        </Typography>
      </Box>

      {settings.idleReminderEnabled && (
        <Stack spacing={2} sx={{ mb: 1, mt: 1.5 }}>
          <NotificationPermissionStatus
            permission={notificationPermission}
            onRequest={onRequestNotificationPermission}
          />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.idleReminderFunny}
                  onChange={(e) => onUpdate('idleReminderFunny', e.target.checked)}
                />
              }
              label="Funny random messages"
              sx={{ justifyContent: 'space-between', ml: 0, width: '100%', '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
              labelPlacement="start"
            />
            {settings.idleReminderFunny ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Each reminder picks a random quip from a pack of 100. For
                example: "This little maneuver is going to cost us 5 minutes."
              </Typography>
            ) : (
              <TextField
                label="Reminder message"
                size="small"
                value={settings.idleReminderMessage}
                onChange={(e) =>
                  onUpdate(
                    'idleReminderMessage',
                    e.target.value.slice(0, IDLE_REMINDER_MESSAGE_MAX),
                  )
                }
                fullWidth
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: IDLE_REMINDER_MESSAGE_MAX } }}
                helperText={`${settings.idleReminderMessage.length}/${IDLE_REMINDER_MESSAGE_MAX}`}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: OPTION_RADIUS } }}
              />
            )}
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.remindOnSessionEnd}
                  onChange={(e) => onUpdate('remindOnSessionEnd', e.target.checked)}
                />
              }
              label="Also remind when a session ends"
              sx={{ justifyContent: 'space-between', ml: 0, width: '100%', '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
              labelPlacement="start"
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              Send a notification the moment a pomodoro or break finishes, not
              just on the idle interval.
            </Typography>
          </Box>
        </Stack>
      )}

      <Box sx={{ mt: 2, mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.idleSoundEnabled}
              onChange={(e) => onUpdate('idleSoundEnabled', e.target.checked)}
            />
          }
          label="Idle sound"
          sx={{ justifyContent: 'space-between', ml: 0, '.MuiFormControlLabel-label': { color: 'text.secondary' } }}
          labelPlacement="start"
        />
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
          Play a short two-beat chime on a loop while the timer is idle. Unlike
          the ringtone, it doesn't ring continuously.
        </Typography>
      </Box>

      {settings.idleSoundEnabled && (
        <Stack spacing={2} sx={{ mb: 1, mt: 1.5 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<PlayArrowRoundedIcon />}
            onClick={onPreviewIdleSound}
            sx={{ alignSelf: 'flex-start', color: 'text.secondary', borderColor: 'divider', borderRadius: OPTION_RADIUS }}
          >
            Preview sound
          </Button>
        </Stack>
      )}

      {/* Shared cadence: a single interval drives both the notification and the
          idle sound, since both exist to pull you back into the cycle. */}
      {(settings.idleReminderEnabled || settings.idleSoundEnabled) && (
        <Box sx={{ mt: 2 }}>
          <NumberStepper
            label="Remind me every"
            value={settings.idleReminderInterval}
            min={REMINDER_INTERVAL_LIMITS.min}
            max={REMINDER_INTERVAL_LIMITS.max}
            suffix="min"
            onChange={(v) => onUpdate('idleReminderInterval', v)}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75 }}>
            Applies to both the notification and the idle sound.
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Appearance */}
      <SectionLabel id="settings-appearance">Appearance</SectionLabel>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Theme"
          value={settings.themeMode}
          onChange={(e) => onUpdate('themeMode', e.target.value as ThemeMode)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: OPTION_RADIUS } }}
        >
          <MenuItem value="light">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LightModeRoundedIcon fontSize="small" /> Light
            </Box>
          </MenuItem>
          <MenuItem value="dark">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DarkModeRoundedIcon fontSize="small" /> Dark
            </Box>
          </MenuItem>
          <MenuItem value="system">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsBrightnessRoundedIcon fontSize="small" /> System
            </Box>
          </MenuItem>
        </TextField>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Accent color
          </Typography>
          <Tooltip title="Change theme color" arrow>
            <Button
              onClick={() => setColorPickerOpen(true)}
              variant="outlined"
              color="inherit"
              size="small"
              sx={{ color: 'text.primary', borderColor: 'divider', gap: 1, borderRadius: OPTION_RADIUS }}
              aria-label={`Accent color: ${accent.name}. Click to change.`}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: swatch,
                }}
              />
              {accent.name}
            </Button>
          </Tooltip>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Data */}
      <SectionLabel id="settings-data">Data</SectionLabel>
      <Box sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onReset}
          sx={{ color: 'text.secondary', borderColor: 'divider', borderRadius: OPTION_RADIUS }}
        >
          Reset to defaults
        </Button>
      </Box>

          <AccentColorPicker
            open={colorPickerOpen}
            value={settings.accentColor}
            onClose={() => setColorPickerOpen(false)}
            onApply={(id) => onUpdate('accentColor', id)}
          />
        </Box>

        {isDesktop && <SettingsQuickNav scrollRef={scrollRef} />}
      </Box>
    </Box>
  )
}
