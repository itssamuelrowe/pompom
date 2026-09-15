import { Box, Typography, Tooltip, useTheme, alpha } from '@mui/material'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import type { Settings } from '../types'
import { getTemplate, matchTemplate } from '../templates'

interface TemplateSummaryProps {
  settings: Settings
}

/**
 * A compact readout of the format the user is working with: the picked
 * template's name (or "Custom" once they've edited away from it) plus the
 * focus / short break / long break durations.
 */
export default function TemplateSummary({ settings }: TemplateSummaryProps) {
  const theme = useTheme()
  const picked = getTemplate(settings.templateId)
  const exactMatch = matchTemplate(settings)

  // If current durations still match the picked template, show its name;
  // otherwise the user has customized it.
  const name =
    exactMatch?.id === settings.templateId
      ? picked?.name ?? exactMatch?.name
      : exactMatch?.name ?? 'Custom'

  return (
    <Tooltip
      title="Adjust these durations anytime in Settings"
      arrow
      enterDelay={400}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          pl: 1,
          pr: 1.75,
          py: 0.75,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          maxWidth: '100%',
        }}
        aria-label={`Current format: ${name}, ${settings.pomodoroDuration} minute focus, ${settings.shortBreakDuration} minute short break, ${settings.longBreakDuration} minute long break`}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            '& svg': { fontSize: 15 },
          }}
        >
          <TuneRoundedIcon />
        </Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: 'text.primary' }}
          noWrap
        >
          {name}
        </Typography>
        <Box
          sx={{ width: '1px', height: 14, bgcolor: 'divider', mx: 0.25 }}
          aria-hidden
        />
        <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
          {settings.pomodoroDuration} / {settings.shortBreakDuration} /{' '}
          {settings.longBreakDuration}
          <Box component="span" sx={{ ml: 0.5, fontSize: 11, opacity: 0.8 }}>
            min
          </Box>
        </Typography>
      </Box>
    </Tooltip>
  )
}
