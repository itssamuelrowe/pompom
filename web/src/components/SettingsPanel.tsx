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
import { useState } from 'react'
import {
  DURATION_LIMITS,
  type Settings,
  type ThemeMode,
  type RingtoneId,
} from '../types'
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
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontWeight: 700,
        letterSpacing: 1,
        display: 'block',
        mb: 1,
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
}: SettingsPanelProps) {
  const theme = useTheme()
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
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        px: { xs: 3, sm: 4 },
        py: { xs: 3, sm: 3.5 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5">Settings</Typography>
        <IconButton onClick={onClose} aria-label="Close settings" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      {/* Format templates — same rich cards as the first-run setup screen. */}
      <SectionLabel>Format</SectionLabel>
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
      <SectionLabel>Sound</SectionLabel>
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
      <SectionLabel>Behavior</SectionLabel>
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

      <Divider sx={{ my: 3 }} />

      {/* Appearance */}
      <SectionLabel>Appearance</SectionLabel>
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
      <SectionLabel>Data</SectionLabel>
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
  )
}
