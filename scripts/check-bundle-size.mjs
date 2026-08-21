import { readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"

const outputDirectory = path.resolve("out")
const html = await readFile(path.join(outputDirectory, "index.html"), "utf8")
const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1])
const initialFiles = [...new Set(scriptSources.map((source) => {
  const staticIndex = source.indexOf("/_next/")
  if (staticIndex < 0) throw new Error(`Script inesperado no HTML: ${source}`)
  return path.join(outputDirectory, source.slice(staticIndex + 1))
}))]

const initialSizes = await Promise.all(initialFiles.map(async (file) => ({ file, bytes: (await stat(file)).size })))
const initialBytes = initialSizes.reduce((total, entry) => total + entry.bytes, 0)
const largestInitialBytes = Math.max(0, ...initialSizes.map((entry) => entry.bytes))
const chunkDirectory = path.join(outputDirectory, "_next", "static", "chunks")
const chunkNames = (await readdir(chunkDirectory)).filter((name) => name.endsWith(".js"))
const chunkSizes = await Promise.all(chunkNames.map(async (name) => ({ name, bytes: (await stat(path.join(chunkDirectory, name))).size })))
const largestChunk = chunkSizes.sort((left, right) => right.bytes - left.bytes)[0]

const maxInitialKb = Number(process.env.MAX_INITIAL_JS_KB ?? 700)
const maxChunkKb = Number(process.env.MAX_JS_CHUNK_KB ?? 450)
const toKb = (bytes) => Math.round(bytes / 102.4) / 10

console.log(`JavaScript inicial: ${toKb(initialBytes)} KB / ${maxInitialKb} KB`)
console.log(`Maior script inicial: ${toKb(largestInitialBytes)} KB`)
console.log(`Maior chunk: ${toKb(largestChunk?.bytes ?? 0)} KB / ${maxChunkKb} KB (${largestChunk?.name ?? "nenhum"})`)

if (toKb(initialBytes) > maxInitialKb) throw new Error("O JavaScript inicial excedeu o orçamento definido.")
if (toKb(largestChunk?.bytes ?? 0) > maxChunkKb) throw new Error("Um chunk JavaScript excedeu o orçamento definido.")
