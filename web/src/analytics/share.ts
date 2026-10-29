import { toBlob } from 'html-to-image'

/** Outcome of a share attempt, so the UI can give specific feedback. */
export type ShareOutcome = 'shared' | 'copied' | 'downloaded' | 'cancelled'

export class ShareError extends Error {}

/**
 * Render a DOM node to a PNG blob. `backgroundColor` fills transparent areas
 * (the report sits on the themed page background). `pixelRatio` 2 yields a
 * crisp, retina-quality image suitable for sharing.
 */
async function nodeToPng(
  node: HTMLElement,
  backgroundColor: string,
): Promise<Blob> {
  const blob = await toBlob(node, {
    backgroundColor,
    pixelRatio: 2,
    // Skip anything explicitly marked as not-for-capture (e.g. the toolbar).
    filter: (el) =>
      !(el instanceof HTMLElement && el.dataset.shareExclude === 'true'),
  })
  if (!blob) throw new ShareError('Could not render the report image.')
  return blob
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function copyToClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof ClipboardItem === 'undefined' ||
    !navigator.clipboard?.write
  ) {
    return false
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob }),
    ])
    return true
  } catch {
    return false
  }
}

/**
 * Capture `node` as a PNG and share it the best way the platform allows:
 *
 * 1. The Web Share API with a file attachment (mobile + some desktop browsers)
 *    so the user can send it straight to any app.
 * 2. Copy the image to the clipboard, so it can be pasted into a chat.
 * 3. Fall back to downloading the PNG.
 *
 * Returns which path was taken so the caller can show the right message.
 */
export async function shareReportImage(
  node: HTMLElement,
  options: { backgroundColor: string; filename?: string; title?: string },
): Promise<ShareOutcome> {
  const { backgroundColor, filename = 'pompom-report.png', title = 'My PomPom report' } =
    options
  const blob = await nodeToPng(node, backgroundColor)
  const file = new File([blob], filename, { type: 'image/png' })

  // 1. Native share sheet with the image file.
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
  }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      // User dismissed the share sheet -> not an error, just stop.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      // Any other failure: fall through to clipboard/download.
    }
  }

  // 2. Clipboard.
  if (await copyToClipboard(blob)) return 'copied'

  // 3. Download.
  triggerDownload(blob, filename)
  return 'downloaded'
}
