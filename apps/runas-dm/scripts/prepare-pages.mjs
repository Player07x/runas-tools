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
  `import application from "./_worker/index.js";

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; connect-src 'self' https://127.0.0.1:* https://localhost:*; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob: https:; manifest-src 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; upgrade-insecure-requests",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export default {
  async fetch(request, env, context) {
    const response = await application.fetch(request, env, context);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
`,
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
