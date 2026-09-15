import { Box, IconButton, InputBase, Typography, useTheme } from '@mui/material'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useState } from 'react'

interface NumberStepperProps {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}

/**
 * A clean stepper input: no native spinner arrows, with explicit −/+ buttons
 * and a centered editable value. Typed values are validated and clamped on blur.
 */
export default function NumberStepper({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: NumberStepperProps) {
  const theme = useTheme()
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  // Sync the editable text if the value changes externally (e.g. reset,
  // stepper buttons). Adjusting state during render avoids an extra effect.
  if (value !== lastValue) {
    setLastValue(value)
    setText(String(value))
  }

  const commit = (raw: string) => {
    const n = Math.round(Number(raw))
    if (!Number.isFinite(n)) {
      setText(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, n))
    onChange(clamped)
    setText(String(clamped))
  }

  const step = (delta: number) => {
    const clamped = Math.min(max, Math.max(min, value + delta))
    onChange(clamped)
    setText(String(clamped))
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        <IconButton
          size="small"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => step(-1)}
          sx={{ borderRadius: 0 }}
        >
          <RemoveRoundedIcon fontSize="small" />
        </IconButton>

        <InputBase
          value={text}
          inputMode="numeric"
          onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ''))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              step(1)
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              step(-1)
            }
          }}
          inputProps={{
            'aria-label': label,
            style: {
              width: suffix ? 30 : 40,
              textAlign: 'center',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: theme.palette.text.primary,
            },
          }}
        />
        {suffix && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', pr: 1, userSelect: 'none' }}
          >
            {suffix}
          </Typography>
        )}

        <IconButton
          size="small"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => step(1)}
          sx={{ borderRadius: 0 }}
        >
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
