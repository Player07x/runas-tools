import type { CharacterGalleryEntry } from "@/types/character"
import { CHARACTER_VERSION } from "@/types/character"
import { characterObsidianFilename, characterToMarkdown } from "@/lib/exportCharacter"
import { saveExportedBlob } from "@/lib/fileExport"

const encoder = new TextEncoder()

function safeFilename(value: string, fallback: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || fallback
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function header(size: number): { bytes: Uint8Array; view: DataView } {
  const bytes = new Uint8Array(size)
  return { bytes, view: new DataView(bytes.buffer) }
}

function join(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

function createZip(files: { name: string; content: string }[]): Uint8Array {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let localOffset = 0

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const checksum = crc32(data)
    const local = header(30)
    local.view.setUint32(0, 0x04034b50, true)
    local.view.setUint16(4, 20, true)
    local.view.setUint32(14, checksum, true)
    local.view.setUint32(18, data.length, true)
    local.view.setUint32(22, data.length, true)
    local.view.setUint16(26, name.length, true)
    localChunks.push(local.bytes, name, data)

    const central = header(46)
    central.view.setUint32(0, 0x02014b50, true)
    central.view.setUint16(4, 20, true)
    central.view.setUint16(6, 20, true)
    central.view.setUint32(16, checksum, true)
    central.view.setUint32(20, data.length, true)
    central.view.setUint32(24, data.length, true)
    central.view.setUint16(28, name.length, true)
    central.view.setUint32(42, localOffset, true)
    centralChunks.push(central.bytes, name)
    localOffset += local.bytes.length + name.length + data.length
  }

  const centralData = join(centralChunks)
  const end = header(22)
  end.view.setUint32(0, 0x06054b50, true)
  end.view.setUint16(8, files.length, true)
  end.view.setUint16(10, files.length, true)
  end.view.setUint32(12, centralData.length, true)
  end.view.setUint32(16, localOffset, true)
  return join([...localChunks, centralData, end.bytes])
}

export function exportGalleryZip(entries: CharacterGalleryEntry[], format: "json" | "md"): Promise<void> | undefined {
  if (typeof window === "undefined" || entries.length === 0) return
  const files = entries.map((entry, index) => {
    const base = format === "md"
      ? characterObsidianFilename(entry.character.name)
      : `${String(index + 1).padStart(2, "0")}_${safeFilename(entry.character.name, "personagem")}`
    return {
      name: `${base}.${format}`,
      content: format === "json"
        ? JSON.stringify({ version: CHARACTER_VERSION, character: entry.character }, null, 2)
        : characterToMarkdown(entry.character),
    }
  })
  const zip = createZip(files)
  const blob = new Blob([zip], { type: "application/zip" })
  return saveExportedBlob(blob, `galeria_personagens_${format}.zip`, "Galeria de personagens do Runas Tools")
}
