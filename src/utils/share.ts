/**
 * shareOrDownloadBlob — tries the Web Share API first (works on iPhone Safari/Chrome),
 * then falls back to an anchor <a download> element for desktop browsers.
 */
export async function shareOrDownloadBlob(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type })

  // Web Share API: available on iOS Safari 15+ and some Android browsers
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: filename,
    })
    return
  }

  // Anchor fallback for desktop / unsupported browsers
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    // Revoke after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(url), 500)
  }
}
