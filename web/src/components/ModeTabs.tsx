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
  const iconSx = {
    display: 'inline-flex',
    alignItems: 'center',
    mr: { xs: 0.5, sm: 0.75 },
    '& svg': { fontSize: { xs: 16, sm: 20 } },
  }
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
          maxWidth: '100%',
          // Match the app's shape scale: outer radius = theme radius,
          // inner buttons sit concentrically inside (theme radius - padding).
          borderRadius: `${Number(theme.shape.borderRadius)}px`,
          gap: 0.5,
          // Keep all three tabs on a single row; shrink them to fit instead.
          flexWrap: 'nowrap',
          '& .MuiToggleButton-root': {
            borderRadius: `${Number(theme.shape.borderRadius) - 4}px`,
            whiteSpace: 'nowrap',
            paddingInline: { xs: 0.75, sm: 2 },
            fontSize: { xs: 11.5, sm: 14 },
            minWidth: 0,
          },
        }}
      >
        <ToggleButton value="pomodoro" aria-label="Pomodoro">
          <Box component="span" sx={iconSx}>
            {ICONS.pomodoro}
          </Box>
          Pomodoro
        </ToggleButton>
        <ToggleButton value="shortBreak" aria-label="Short break">
          <Box component="span" sx={iconSx}>
            {ICONS.shortBreak}
          </Box>
          Short Break
        </ToggleButton>
        <ToggleButton value="longBreak" aria-label="Long break">
          <Box component="span" sx={iconSx}>
            {ICONS.longBreak}
          </Box>
          Long Break
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
