import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const distRoot = join(projectRoot, "dist")
const clientDir = join(distRoot, "client")
const serverDir = join(distRoot, "server")
const pagesDir = join(distRoot, "pages")
const workerModulesDir = join(pagesDir, "_worker")
const pagesDatabaseId = "afe0dde7-ffcd-4fe7-8cf1-dee50595e74f"

const workerConfigPath = join(serverDir, "wrangler.json")
const workerConfig = JSON.parse(await readFile(workerConfigPath, "utf8"))
workerConfig.d1_databases = [
  ...(workerConfig.d1_databases ?? []).filter((database) => database.binding !== "DB"),
  {
    binding: "DB",
    database_name: "runas-dm-backups",
    database_id: pagesDatabaseId,
  },
]
await writeFile(workerConfigPath, `${JSON.stringify(workerConfig)}\n`, "utf8")

await rm(pagesDir, { force: true, recursive: true })
await mkdir(pagesDir, { recursive: true })
await cp(clientDir, pagesDir, { recursive: true })
await cp(serverDir, workerModulesDir, { recursive: true })
// Pages receives bindings from the project-level wrangler.jsonc. The Vinext
// build emits its own Worker configuration with placeholder bindings, which
// must not be bundled as a second Pages configuration.
await rm(join(workerModulesDir, "wrangler.json"), { force: true })
await rm(workerConfigPath, { force: true })
await rm(join(projectRoot, ".wrangler", "deploy"), { force: true, recursive: true })

await writeFile(
  join(pagesDir, "_worker.js"),
  'export { default } from "./_worker/index.js";\n',
  "utf8",
)

const existingIgnore = await readFile(join(clientDir, ".assetsignore"), "utf8")
await writeFile(
  join(pagesDir, ".assetsignore"),
  `${existingIgnore.trim()}\n_worker/**\n`,
  "utf8",
)

await writeFile(
  join(pagesDir, "_routes.json"),
  `${JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: [
      "/_next/static/*",
      "/favicon.svg",
      "/icon-192.png",
      "/icon-512.png",
      "/sw.js",
    ],
  }, null, 2)}\n`,
  "utf8",
)

console.log(`Cloudflare Pages output prepared at ${pagesDir}`)
