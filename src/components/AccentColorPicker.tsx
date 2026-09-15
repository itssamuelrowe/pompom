import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { useState } from 'react'
import { ACCENT_COLORS } from '../theme/palette'

interface AccentColorPickerProps {
  open: boolean
  value: string
  onClose: () => void
  onApply: (id: string) => void
}

export default function AccentColorPicker({
  open,
  value,
  onClose,
  onApply,
}: AccentColorPickerProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [selected, setSelected] = useState(value)

  const handleApply = () => {
    onApply(selected)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        Choose a theme color
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 1.5,
            py: 1,
          }}
        >
          {ACCENT_COLORS.map((c) => {
            const swatch = isDark ? c.darkMain : c.main
            const isSelected = selected === c.id
            return (
              <Tooltip key={c.id} title={c.name} arrow>
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={c.name}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(c.id)
                    }
                  }}
                  sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    bgcolor: swatch,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    outline: isSelected
                      ? `3px solid ${swatch}`
                      : '3px solid transparent',
                    outlineOffset: 2,
                    transition: 'transform 0.15s, outline-color 0.15s',
                    '&:hover': { transform: 'scale(1.08)' },
                    '&:focus-visible': {
                      outline: `3px solid ${theme.palette.text.primary}`,
                    },
                  }}
                >
                  {isSelected && <CheckRoundedIcon fontSize="small" />}
                </Box>
              </Tooltip>
            )
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleApply} variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  )
}
