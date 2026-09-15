import { Box } from '@mui/material'
import logoUrl from '../assets/logo.png'

interface LogoProps {
  size?: number
}

/** PomPom brand mark. */
export default function Logo({ size = 40 }: LogoProps) {
  return (
    <Box
      component="img"
      src={logoUrl}
      alt="PomPom logo"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
        objectFit: 'contain',
      }}
    />
  )
}
