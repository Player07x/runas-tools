import { cp, mkdir, rm } from "node:fs/promises"
import path from "node:path"

const outputDirectory = path.resolve("out")
const auditDirectory = path.resolve(".lighthouse-dist")

await rm(auditDirectory, { recursive: true, force: true })
await mkdir(auditDirectory, { recursive: true })

await cp(outputDirectory, auditDirectory, { recursive: true })
