import { cp, mkdir, rm } from "node:fs/promises"
import path from "node:path"

const outputDirectory = path.resolve("out")
const auditDirectory = path.resolve(".lighthouse-dist")
const projectDirectory = path.join(auditDirectory, "runas-tools")

await rm(auditDirectory, { recursive: true, force: true })
await mkdir(auditDirectory, { recursive: true })

// A cópia na raiz atende builds locais; a cópia aninhada reproduz o basePath
// usado pelo GitHub Pages e permite auditar exatamente o artefato publicado.
await cp(outputDirectory, auditDirectory, { recursive: true })
await cp(outputDirectory, projectDirectory, { recursive: true })
