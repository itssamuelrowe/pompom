import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import OvertimeHistory from './OvertimeHistory'
import type { OvertimeEntry } from '../types'

interface OvertimeHistoryDialogProps {
  open: boolean
  entries: OvertimeEntry[]
  onClose: () => void
  onRemove: (id: string) => void
  onClear: () => void
}

/** A popup that shows the full overtime history log. */
export default function OvertimeHistoryDialog({
  open,
  entries,
  onClose,
  onRemove,
  onClear,
}: OvertimeHistoryDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        Overtime history
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <OvertimeHistory entries={entries} onRemove={onRemove} />
        {entries.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={onClear}
              startIcon={<DeleteSweepRoundedIcon fontSize="small" />}
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              Clear all
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
