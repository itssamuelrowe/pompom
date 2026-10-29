import { Box, Button, Paper, Typography, alpha, useTheme } from '@mui/material'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import GitHubIcon from '@mui/icons-material/GitHub'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

const REPO_URL = 'https://github.com/itssamuelrowe/pompom'
const ISLAND_WEBP = `${import.meta.env.BASE_URL}low-poly-mountain-trail-island.webp`
const ISLAND_PNG = `${import.meta.env.BASE_URL}low-poly-mountain-trail-island.png`

/**
 * A personal note from the author at the very bottom of the home screen, in his
 * own words, on why PomPom exists.
 */
export default function WhyBuilt() {
  const theme = useTheme()
  const accent = theme.palette.primary.main

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 4, md: 5 },
        borderRadius: 4,
        border: 1,
        borderColor: 'divider',
        backgroundImage: `linear-gradient(135deg, ${alpha(accent, 0.06)}, transparent 55%)`,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px', lg: 'minmax(0, 1fr) 360px' },
        columnGap: { md: 5, lg: 6 },
        alignItems: 'center',
      }}
    >
      {/* Left: the note. */}
      <Box sx={{ minWidth: 0, maxWidth: 640 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: accent,
              bgcolor: alpha(accent, 0.12),
              flexShrink: 0,
            }}
          >
            <FavoriteRoundedIcon />
          </Box>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1, lineHeight: 1 }}
            >
              A note from the maker
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, lineHeight: 1.2 }}
            >
              Why I built this tool
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            color: 'text.secondary',
            '& p': { mb: 1.75, lineHeight: 1.75 },
          }}
        >
        <Typography component="p">
          I've been dealing with severe eye strain for years due to bad reading
          angles, too much screen time, and an old gym injury. As a software
          developer, I need a screen to earn my livelihood, but working for too
          long can leave me suffering for days. The Pomodoro technique helped,
          but existing tools couldn't stop me from overworking.
        </Typography>
        <Typography component="p">
          That's why I built this tool to track my habits and help me take
          breaks when I'm tempted to push myself too hard. I'm sharing it{' '}
          <Box component="strong" sx={{ color: 'text.primary', fontWeight: 600 }}>
            completely free
          </Box>{' '}
          in the hope that it helps others, whether they're already struggling
          with their health or simply want to protect it. All I ask is that you
          star our GitHub repo and share it with your friends. Most importantly,
          take care of your health. I learnt this lesson the hard way, and I
          hope you don't have to.
        </Typography>
        </Box>

        {/* Sign-off + CTA */}
        <Box
          sx={{
            mt: 3,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.2,
              }}
            >
              Samuel Rowe
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Creator of PomPom
            </Typography>
          </Box>

          <Button
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<GitHubIcon />}
            endIcon={<StarRoundedIcon />}
          >
            Star PomPom on GitHub
          </Button>
        </Box>
      </Box>

      {/* Right: decorative island artwork, anchored at the top with a soft glow
          and a short tagline so the column reads as intentional, not empty.
          Hidden on small screens to avoid extra scrolling. */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          alignSelf: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            display: 'grid',
            placeItems: 'center',
            // A warmer, more present radial glow so the artwork feels lit from
            // behind rather than floating on a flat panel.
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '-6% -4%',
              borderRadius: '50%',
              background: `radial-gradient(circle at 50% 45%, ${alpha(accent, 0.38)}, ${alpha(accent, 0.14)} 45%, transparent 72%)`,
              filter: 'blur(14px)',
              zIndex: 0,
            },
          }}
        >
          <Box component="picture" sx={{ position: 'relative', display: 'block', width: '100%' }}>
            <source srcSet={ISLAND_WEBP} type="image/webp" />
            <Box
              component="img"
              src={ISLAND_PNG}
              alt="A low-poly mountain trail island illustration"
              loading="lazy"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                userSelect: 'none',
                filter: `drop-shadow(0 14px 28px ${alpha(theme.palette.common.black, 0.3)})`,
                transformOrigin: 'center',
                // A gentle float: the island drifts up and down with a faint
                // sway, as if hovering in the air.
                '@keyframes pompom-island-float': {
                  '0%': { transform: 'translateY(0) rotate(-0.6deg)' },
                  '50%': { transform: 'translateY(-12px) rotate(0.6deg)' },
                  '100%': { transform: 'translateY(0) rotate(-0.6deg)' },
                },
                animation: 'pompom-island-float 6s ease-in-out infinite',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', maxWidth: 240, lineHeight: 1.6 }}
        >
          Made with care, and shared for free. Take the scenic route, and rest
          along the way.
        </Typography>
      </Box>
    </Paper>
  )
}
