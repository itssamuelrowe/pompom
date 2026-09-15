import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material'
import TimerRoundedIcon from '@mui/icons-material/TimerRounded'
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded'
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded'
import LoopRoundedIcon from '@mui/icons-material/LoopRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { DEFAULT_TEMPLATE_ID, type Template } from '../templates'

const CARD_RADIUS = 10

// A representative icon per template keeps the list scannable at a glance.
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  classic: <FavoriteRoundedIcon />,
  'deep-work': <PsychologyRoundedIcon />,
  'eye-back-relief': <VisibilityRoundedIcon />,
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          color: 'text.secondary',
          '& svg': { fontSize: 15 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ lineHeight: 1.1 }}>
        <Typography
          component="span"
          sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}
        >
          {value}
        </Typography>{' '}
        <Typography
          component="span"
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

interface TemplateCardProps {
  template: Template
  onSelect: (template: Template) => void
  /** Highlights the card as the current selection (used in Settings). */
  active?: boolean
  /** Trailing adornment, e.g. an arrow (setup) or a check (settings). */
  trailing?: React.ReactNode
  /** Show the "Recommended" tag on the default template. Default: true. */
  showRecommended?: boolean
}

/**
 * The rich template option card shared by the first-run setup screen and the
 * Settings panel: an accent icon badge, name (+ optional Recommended tag),
 * description, and a single-row breakdown of the durations.
 */
export default function TemplateCard({
  template: t,
  onSelect,
  active = false,
  trailing,
  showRecommended = true,
}: TemplateCardProps) {
  const theme = useTheme()
  const recommended = showRecommended && t.id === DEFAULT_TEMPLATE_ID

  // Active selection takes visual priority over the recommended hint.
  const borderColor = active
    ? 'primary.main'
    : recommended
      ? alpha(theme.palette.primary.main, 0.5)
      : 'divider'

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor,
        borderRadius: `${CARD_RADIUS}px`,
        bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
        transition:
          'border-color 0.2s, background-color 0.2s, transform 0.1s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha(
            theme.palette.primary.main,
            active ? 0.1 : 0.04,
          ),
        },
        '&:active': { transform: 'scale(0.994)' },
      }}
    >
      <CardActionArea
        onClick={() => onSelect(t)}
        sx={{
          p: { xs: 1.5, sm: 1.75 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: `${CARD_RADIUS}px`,
        }}
        aria-pressed={active}
        aria-label={`${t.name}: ${t.pomodoroDuration} minute focus, ${t.shortBreakDuration} minute short break, ${t.longBreakDuration} minute long break, ${t.pomodorosBeforeLongBreak} per cycle`}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: '7px',
            display: 'grid',
            placeItems: 'center',
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            '& svg': { fontSize: 21 },
          }}
        >
          {TEMPLATE_ICONS[t.id] ?? <TimerRoundedIcon />}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {t.name}
            </Typography>
            {recommended && (
              <Chip
                label="Recommended"
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.14),
                  '.MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 1, mt: 0.25 }}
          >
            {t.description}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              columnGap: 0.75,
            }}
          >
            <Metric icon={<TimerRoundedIcon />} value={`${t.pomodoroDuration}m`} label="focus" />
            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />
            <Metric icon={<LocalCafeRoundedIcon />} value={`${t.shortBreakDuration}m`} label="short" />
            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />
            <Metric icon={<SelfImprovementRoundedIcon />} value={`${t.longBreakDuration}m`} label="long" />
            <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />
            <Metric icon={<LoopRoundedIcon />} value={`${t.pomodorosBeforeLongBreak}×`} label="cycle" />
          </Box>
        </Box>

        {trailing && (
          <Box sx={{ flexShrink: 0, display: 'inline-flex' }}>{trailing}</Box>
        )}
      </CardActionArea>
    </Card>
  )
}
