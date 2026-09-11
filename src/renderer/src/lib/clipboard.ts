// Pasted images are stored inline as base64 data URIs, which are unreadable outside the app
const EMBEDDED_IMAGE_REGEX = /!\[[^\]]*\]\(data:image\/[^)]*\)/g

export function formatForClipboard(content: string): string {
  return content.replace(EMBEDDED_IMAGE_REGEX, '[image]').trim()
}
