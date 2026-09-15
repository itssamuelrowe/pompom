import { ToggleButton, ToggleButtonGroup, Box, useTheme } from '@mui/material'
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded'
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded'
import TimerRoundedIcon from '@mui/icons-material/TimerRounded'
import type { TimerMode } from '../types'

interface ModeTabsProps {
  mode: TimerMode
  onChange: (mode: TimerMode) => void
}

const ICONS: Record<TimerMode, React.ReactNode> = {
  pomodoro: <TimerRoundedIcon fontSize="small" />,
  shortBreak: <LocalCafeRoundedIcon fontSize="small" />,
  longBreak: <SelfImprovementRoundedIcon fontSize="small" />,
}

export default function ModeTabs({ mode, onChange }: ModeTabsProps) {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, value: TimerMode | null) => value && onChange(value)}
        aria-label="Timer mode"
        sx={{
          bgcolor: 'action.hover',
          p: 0.5,
          // Match the app's shape scale: outer radius = theme radius,
          // inner buttons sit concentrically inside (theme radius - padding).
          borderRadius: `${Number(theme.shape.borderRadius)}px`,
          gap: 0.5,
          flexWrap: 'wrap',
          '& .MuiToggleButton-root': {
            borderRadius: `${Number(theme.shape.borderRadius) - 4}px`,
          },
        }}
      >
        <ToggleButton value="pomodoro" aria-label="Pomodoro">
          {ICONS.pomodoro}&nbsp;Pomodoro
        </ToggleButton>
        <ToggleButton value="shortBreak" aria-label="Short break">
          {ICONS.shortBreak}&nbsp;Short Break
        </ToggleButton>
        <ToggleButton value="longBreak" aria-label="Long break">
          {ICONS.longBreak}&nbsp;Long Break
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
