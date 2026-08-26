const MOBILE_BREAKPOINT = 760
const DESKTOP_GUTTER = 48

export function simpleSheetWidthBounds(viewportWidth: number): { minimum: number; maximum: number } {
  const safeViewport = Math.max(320, viewportWidth)
  if (safeViewport <= MOBILE_BREAKPOINT) {
    return { minimum: safeViewport, maximum: safeViewport }
  }
  return {
    minimum: Math.round(safeViewport / 2),
    maximum: safeViewport - DESKTOP_GUTTER,
  }
}

export function clampSimpleSheetWidth(width: number, viewportWidth: number): number {
  const { minimum, maximum } = simpleSheetWidthBounds(viewportWidth)
  return Math.min(maximum, Math.max(minimum, Math.round(width)))
}

export function plainTextSummary(value: string, maximumLength = 40): string {
  const plainText = value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()

  if (plainText.length <= maximumLength) return plainText
  if (maximumLength <= 1) return "…".slice(0, maximumLength)
  return `${plainText.slice(0, maximumLength - 1).trimEnd()}…`
}

