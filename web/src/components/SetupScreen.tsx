import { useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  Card,
  CardActionArea,
  Button,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import Logo from './Logo'
import NumberStepper from './NumberStepper'
import TemplateCard from './TemplateCard'
import { TEMPLATES, type Template } from '../templates'
import { DEFAULT_SETTINGS, DURATION_LIMITS } from '../types'

const ISLAND_WEBP = `${import.meta.env.BASE_URL}low-poly-mountain-trail-island.webp`
const ISLAND_PNG = `${import.meta.env.BASE_URL}low-poly-mountain-trail-island.png`

export interface CustomDurations {
  pomodoroDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosBeforeLongBreak: number
}

interface SetupScreenProps {
  onSelect: (template: Template) => void
  onCustom: (durations: CustomDurations) => void
}

export default function SetupScreen({ onSelect, onCustom }: SetupScreenProps) {
  const theme = useTheme()
  // Crisp, lightly-rounded option cards (not pill-like).
  const radius = 10
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  // The chooser toggles between the template list and the custom form.
  const [view, setView] = useState<'list' | 'custom'>('list')
  const [custom, setCustom] = useState<CustomDurations>({
    pomodoroDuration: DEFAULT_SETTINGS.pomodoroDuration,
    shortBreakDuration: DEFAULT_SETTINGS.shortBreakDuration,
    longBreakDuration: DEFAULT_SETTINGS.longBreakDuration,
    pomodorosBeforeLongBreak: DEFAULT_SETTINGS.pomodorosBeforeLongBreak,
  })

  const setCustomField = (key: keyof CustomDurations, value: number) =>
    setCustom((prev) => ({ ...prev, [key]: value }))

  const artwork = (
    <Box
      sx={{
        position: 'relative',
        flex: { md: '0 0 44%' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, md: 5 },
        py: { xs: 4, md: 6 },
        overflow: 'hidden',
        // A soft accent wash behind the island on desktop.
        background: {
          xs: 'transparent',
          md: `radial-gradient(120% 90% at 50% 10%, ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.18 : 0.14,
          )} 0%, transparent 60%)`,
        },
      }}
    >
      <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 420 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Logo size={40} />
          <Typography variant="h5" sx={{ letterSpacing: '-0.02em' }}>
            PomPom
          </Typography>
        </Box>
        <Box
          component="picture"
          sx={{ display: 'block', width: '100%' }}
        >
          <source srcSet={ISLAND_WEBP} type="image/webp" />
          <Box
            component="img"
            src={ISLAND_PNG}
            alt="A calm low-poly mountain trail on a floating island"
            loading="eager"
            decoding="async"
            sx={{
              width: '100%',
              maxWidth: { xs: 280, sm: 340, md: 420 },
              height: 'auto',
              mx: 'auto',
              filter: `drop-shadow(0 24px 40px ${alpha('#000', 0.35)})`,
              userSelect: 'none',
            }}
          />
        </Box>
        {isDesktop && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Small, steady steps. Set your rhythm and start the climb.
          </Typography>
        )}
      </Stack>
    </Box>
  )

  const listView = (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, sm: 5, md: 6 },
        py: { xs: 2, md: 6 },
        maxWidth: 560,
        width: '100%',
        mx: 'auto',
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1.5 }}
      >
        Let's set up
      </Typography>
      <Typography variant="h4" sx={{ letterSpacing: '-0.02em', mb: 0.75 }}>
        Choose your focus format
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Pick a rhythm to start with. You can fine-tune every duration later in
        Settings.
      </Typography>

      <Stack spacing={1.25}>
        {TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onSelect={onSelect}
            trailing={
              <ArrowForwardRoundedIcon
                sx={{ color: 'text.secondary', fontSize: 20 }}
              />
            }
          />
        ))}

        {/* Custom: start from defaults and tweak everything in Settings. */}
        <Card
          variant="outlined"
          sx={{
            borderStyle: 'dashed',
            borderColor: 'divider',
            borderRadius: `${radius}px`,
            bgcolor: 'transparent',
            transition: 'border-color 0.2s, background-color 0.2s, transform 0.1s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
            '&:active': { transform: 'scale(0.994)' },
          }}
        >
          <CardActionArea
            onClick={() => setView('custom')}
            sx={{
              p: { xs: 1.75, sm: 2 },
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              borderRadius: `${radius}px`,
            }}
            aria-label="Start with a custom format and set durations yourself"
          >
            <Box
              sx={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: `${radius - 4}px`,
                display: 'grid',
                placeItems: 'center',
                color: 'text.secondary',
                bgcolor: 'action.hover',
                '& svg': { fontSize: 22 },
              }}
            >
              <TuneRoundedIcon />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Custom
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                Start fresh and dial in your own durations in Settings.
              </Typography>
            </Box>
            <ArrowForwardRoundedIcon
              sx={{ flexShrink: 0, color: 'text.secondary', fontSize: 20 }}
            />
          </CardActionArea>
        </Card>
      </Stack>
    </Box>
  )

  const customForm = (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 3, sm: 5, md: 6 },
        py: { xs: 2, md: 6 },
        maxWidth: 560,
        width: '100%',
        mx: 'auto',
      }}
    >
      <Button
        onClick={() => setView('list')}
        startIcon={<ArrowBackRoundedIcon />}
        color="inherit"
        size="small"
        sx={{
          alignSelf: 'flex-start',
          color: 'text.secondary',
          ml: -1,
          mb: 1.5,
        }}
      >
        Back to templates
      </Button>

      <Typography
        variant="overline"
        sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 1.5 }}
      >
        Custom format
      </Typography>
      <Typography variant="h4" sx={{ letterSpacing: '-0.02em', mb: 0.75 }}>
        Set your own rhythm
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Choose how long each block runs. You can always change these later in
        Settings.
      </Typography>

      <Stack spacing={1.5}>
        <NumberStepper
          label="Focus"
          value={custom.pomodoroDuration}
          min={DURATION_LIMITS.min}
          max={DURATION_LIMITS.max}
          suffix="min"
          onChange={(v) => setCustomField('pomodoroDuration', v)}
        />
        <NumberStepper
          label="Short break"
          value={custom.shortBreakDuration}
          min={DURATION_LIMITS.min}
          max={DURATION_LIMITS.max}
          suffix="min"
          onChange={(v) => setCustomField('shortBreakDuration', v)}
        />
        <NumberStepper
          label="Long break"
          value={custom.longBreakDuration}
          min={DURATION_LIMITS.min}
          max={DURATION_LIMITS.max}
          suffix="min"
          onChange={(v) => setCustomField('longBreakDuration', v)}
        />
        <NumberStepper
          label="Focus blocks before a long break"
          value={custom.pomodorosBeforeLongBreak}
          min={DURATION_LIMITS.poolMin}
          max={DURATION_LIMITS.poolMax}
          onChange={(v) => setCustomField('pomodorosBeforeLongBreak', v)}
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForwardRoundedIcon />}
        onClick={() => onCustom(custom)}
        sx={{ mt: 3.5, alignSelf: 'flex-start' }}
      >
        Start focusing
      </Button>
    </Box>
  )

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {artwork}
      {view === 'list' ? listView : customForm}
    </Box>
  )
}
