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
} from '@mui/material'
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
import { RINGTONES } from '../audio/ringtones'
import { getAccentColor } from '../theme/palette'
import AccentColorPicker from './AccentColorPicker'
import NumberStepper from './NumberStepper'

interface SettingsPanelProps {
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReset: () => void
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

export default function SettingsPanel({
  settings,
  onUpdate,
  onReset,
  onClose,
  onPreview,
  onStopPreview,
  isPreviewing,
}: SettingsPanelProps) {
  const theme = useTheme()
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const accent = getAccentColor(settings.accentColor)
  const swatch = theme.palette.mode === 'dark' ? accent.darkMain : accent.main

  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        p: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5">Settings</Typography>
        <IconButton onClick={onClose} aria-label="Close settings" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      {/* Durations */}
      <SectionLabel>Timer Durations</SectionLabel>
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

      <Divider sx={{ my: 2 }} />

      {/* Sound */}
      <SectionLabel>Sound</SectionLabel>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Ringtone"
          value={settings.ringtone}
          onChange={(e) => onUpdate('ringtone', e.target.value as RingtoneId)}
          fullWidth
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
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
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

      <Divider sx={{ my: 2 }} />

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

      <Divider sx={{ my: 2 }} />

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
              sx={{ color: 'text.primary', borderColor: 'divider', gap: 1 }}
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

      <Divider sx={{ my: 2 }} />

      {/* Data */}
      <SectionLabel>Data</SectionLabel>
      <Button
        variant="outlined"
        color="inherit"
        onClick={onReset}
        sx={{ color: 'text.secondary', borderColor: 'divider' }}
      >
        Reset to defaults
      </Button>

      <AccentColorPicker
        open={colorPickerOpen}
        value={settings.accentColor}
        onClose={() => setColorPickerOpen(false)}
        onApply={(id) => onUpdate('accentColor', id)}
      />
    </Box>
  )
}
