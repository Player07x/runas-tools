import { parseCharacterFile } from "@/lib/characterStorage"
import type { Character } from "@/types/character"

const decoder = new TextDecoder()
const MAX_ZIP_ENTRIES = 100
const MAX_JSON_SIZE = 5 * 1024 * 1024
const MAX_TOTAL_SIZE = 20 * 1024 * 1024

export interface GalleryZipCharacter {
  id: string
  filename: string
  character: Character
}

export interface GalleryZipImportResult {
  characters: GalleryZipCharacter[]
  ignoredFiles: number
}

interface ZipEntry {
  filename: string
  compression: number
  compressedSize: number
  uncompressedSize: number
  localOffset: number
  encrypted: boolean
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimum = Math.max(0, bytes.length - 65_557)
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true) === 0x06054b50) return offset
  }
  throw new Error("Arquivo ZIP inválido.")
}

function readEntries(bytes: Uint8Array): ZipEntry[] {
  const endOffset = findEndOfCentralDirectory(bytes)
  const end = new DataView(bytes.buffer, bytes.byteOffset + endOffset, bytes.length - endOffset)
  const entryCount = end.getUint16(10, true)
  let offset = end.getUint32(16, true)
  if (entryCount > MAX_ZIP_ENTRIES) throw new Error(`O ZIP possui mais de ${MAX_ZIP_ENTRIES} arquivos.`)

  const entries: ZipEntry[] = []
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length) throw new Error("Diretório do ZIP incompleto.")
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 46)
    if (view.getUint32(0, true) !== 0x02014b50) throw new Error("Diretório do ZIP inválido.")
    const flags = view.getUint16(8, true)
    const filenameLength = view.getUint16(28, true)
    const extraLength = view.getUint16(30, true)
    const commentLength = view.getUint16(32, true)
    const filenameStart = offset + 46
    const filenameEnd = filenameStart + filenameLength
    if (filenameEnd > bytes.length) throw new Error("Nome de arquivo inválido no ZIP.")
    entries.push({
      filename: decoder.decode(bytes.subarray(filenameStart, filenameEnd)),
      compression: view.getUint16(10, true),
      compressedSize: view.getUint32(20, true),
      uncompressedSize: view.getUint32(24, true),
      localOffset: view.getUint32(42, true),
      encrypted: Boolean(flags & 1),
    })
    offset = filenameEnd + extraLength + commentLength
  }
  return entries
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") throw new Error("Este navegador não suporta ZIP comprimido.")
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function readEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  if (entry.encrypted) throw new Error("Arquivos protegidos por senha não são aceitos.")
  if (entry.uncompressedSize > MAX_JSON_SIZE) throw new Error("Ficha maior que 5 MB.")
  if (entry.localOffset + 30 > bytes.length) throw new Error("Entrada incompleta no ZIP.")
  const local = new DataView(bytes.buffer, bytes.byteOffset + entry.localOffset, 30)
  if (local.getUint32(0, true) !== 0x04034b50) throw new Error("Entrada inválida no ZIP.")
  const dataStart = entry.localOffset + 30 + local.getUint16(26, true) + local.getUint16(28, true)
  const dataEnd = dataStart + entry.compressedSize
  if (dataEnd > bytes.length) throw new Error("Conteúdo incompleto no ZIP.")
  const compressed = bytes.slice(dataStart, dataEnd)
  if (entry.compression === 0) return compressed
  if (entry.compression === 8) return inflateRaw(compressed)
  throw new Error("Método de compressão não suportado.")
}

export async function parseGalleryZip(file: File): Promise<GalleryZipImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const jsonEntries = readEntries(bytes).filter((entry) => entry.filename.toLocaleLowerCase().endsWith(".json"))
  let totalSize = 0
  let ignoredFiles = 0
  const characters: GalleryZipCharacter[] = []

  for (const [index, entry] of jsonEntries.entries()) {
    try {
      totalSize += entry.uncompressedSize
      if (totalSize > MAX_TOTAL_SIZE) throw new Error("O conteúdo do ZIP é muito grande.")
      const content = await readEntry(bytes, entry)
      characters.push({
        id: `${index}-${entry.localOffset}-${entry.filename}`,
        filename: entry.filename.split(/[\\/]/).pop() || `ficha-${index + 1}.json`,
        character: parseCharacterFile(decoder.decode(content)),
      })
    } catch {
      ignoredFiles += 1
    }
  }

  if (characters.length === 0) throw new Error("Nenhuma ficha JSON válida foi encontrada no ZIP.")
  return { characters, ignoredFiles }
}
