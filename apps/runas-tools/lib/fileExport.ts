interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{ description?: string; accept: Record<string, string[]> }>
}

interface WritableFileHandle {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>
    close: () => Promise<void>
  }>
}

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<WritableFileHandle>
}

function extension(filename: string): string {
  const match = filename.match(/(\.[^.]+)$/)
  return match?.[1] ?? ""
}

/**
 * No desktop, abre o seletor nativo de arquivo, permitindo escolher nome e pasta.
 * Em navegadores sem File System Access API, preserva o download convencional.
 */
export async function saveExportedBlob(blob: Blob, filename: string, description = "Arquivo do Runas Tools"): Promise<void> {
  if (typeof window === "undefined") return
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker
  if (picker) {
    try {
      const suffix = extension(filename)
      const handle = await picker({
        suggestedName: filename,
        types: suffix ? [{ description, accept: { [blob.type || "application/octet-stream"]: [suffix] } }] : undefined,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      // Falhas de suporte/permissão ainda permitem o download convencional.
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function saveExportedJson(content: unknown, filename: string): Promise<void> {
  return saveExportedBlob(
    new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }),
    filename,
    "Arquivo JSON do Runas Tools",
  )
}
