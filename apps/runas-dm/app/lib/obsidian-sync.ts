import { CAMPAIGN_PAGE_KINDS, WIKI_SECTIONS, type CampaignRecord, type KnowledgePage, type KnowledgeWorkspaceState } from "./knowledge-model"
import { createTextZip, downloadBlob, safeFilename } from "./export"

export interface ObsidianConnection {
  baseUrl: string
  apiKey: string
  rootFolder: string
}

function yaml(value: string): string {
  return JSON.stringify(value)
}

function filePart(value: string, fallback: string): string {
  return safeFilename(value, fallback).replace(/_/g, " ")
}

export function htmlToMarkdown(value: string): string {
  if (typeof DOMParser === "undefined") return value.replace(/<[^>]+>/g, "").trim()
  const documentValue = new DOMParser().parseFromString(value, "text/html")
  const render = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
    if (!(node instanceof HTMLElement)) return ""
    const children = [...node.childNodes].map(render).join("")
    switch (node.tagName) {
      case "H1": return `# ${children.trim()}\n\n`
      case "H2": return `## ${children.trim()}\n\n`
      case "H3": return `### ${children.trim()}\n\n`
      case "P": return `${children.trim()}\n\n`
      case "DIV": return `${children.trim()}\n\n`
      case "BR": return "\n"
      case "STRONG": case "B": return `**${children}**`
      case "EM": case "I": return `*${children}*`
      case "U": return `<u>${children}</u>`
      case "BLOCKQUOTE": return children.split("\n").filter(Boolean).map((line) => `> ${line}`).join("\n") + "\n\n"
      case "UL": return `${[...node.children].map((child) => `- ${render(child).trim()}`).join("\n")}\n\n`
      case "OL": return `${[...node.children].map((child, index) => `${index + 1}. ${render(child).trim()}`).join("\n")}\n\n`
      case "LI": return children
      case "A": return `[${children}](${node.getAttribute("href") ?? ""})`
      case "IMG": {
        const obsidianPath = node.getAttribute("data-obsidian-path")
        return obsidianPath ? `![[${obsidianPath}]]\n\n` : `![${node.getAttribute("alt") ?? "Imagem"}](${node.getAttribute("src") ?? ""})\n\n`
      }
      case "HR": return "---\n\n"
      case "CODE": return `\`${children}\``
      case "PRE": return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`
      default: return children
    }
  }
  return [...documentValue.body.childNodes].map(render).join("").replace(/\n{3,}/g, "\n\n").trim()
}

function kindLabel(page: KnowledgePage): string {
  return WIKI_SECTIONS.find((item) => item.id === page.kind)?.label ?? CAMPAIGN_PAGE_KINDS.find((item) => item.id === page.kind)?.label ?? page.kind
}

function campaignFor(page: KnowledgePage, campaigns: CampaignRecord[]): CampaignRecord | undefined {
  return campaigns.find((campaign) => campaign.id === page.campaignId)
}

export function pageToMarkdown(page: KnowledgePage, state: KnowledgeWorkspaceState): string {
  const campaign = campaignFor(page, state.campaigns)
  const categories = state.categories.filter((category) => page.categoryIds.includes(category.id)).map((category) => category.name)
  const linked = state.pages.filter((candidate) => page.linkedPageIds.includes(candidate.id)).map((candidate) => candidate.title)
  const frontmatter = [
    "---", `runas_id: ${yaml(page.id)}`, `tipo: ${yaml(kindLabel(page))}`, `status: ${yaml(page.status)}`,
    page.date ? `data: ${yaml(page.date)}` : "", campaign ? `campanha: ${yaml(campaign.title)}` : "",
    `tags: [${page.tags.map(yaml).join(", ")}]`, `categorias: [${categories.map(yaml).join(", ")}]`,
    page.bestiaryEntryId ? `ficha_bestiario: ${yaml(page.bestiaryEntryId)}` : "", "---",
  ].filter(Boolean).join("\n")
  const relations = linked.length ? `\n\n## Páginas relacionadas\n${linked.map((title) => `- [[${title}]]`).join("\n")}` : ""
  const encounter = page.encounterCreatures.length ? `\n\n## Fichas do encontro\n${page.encounterCreatures.map((item) => `- ${item.quantity}× ${item.name} \`${item.entryId}\``).join("\n")}` : ""
  const body = page.kind === "encounter" ? "" : htmlToMarkdown(page.contentHtml)
  return `${frontmatter}\n\n# ${page.title}\n\n${page.summary ? `${page.kind === "encounter" ? "## Notas do mestre\n\n" : ""}${page.summary}\n\n` : ""}${body}${relations}${encounter}\n`
}

export function obsidianPathForPage(page: KnowledgePage, state: KnowledgeWorkspaceState, rootFolder = "Runas DM"): string {
  const root = rootFolder.split("/").map((part) => filePart(part, "Runas DM")).filter(Boolean).join("/")
  const kind = filePart(kindLabel(page), "Páginas")
  const name = filePart(page.title, "Página sem nome")
  if (page.scope === "wiki") return `${root}/Wiki/${kind}/${name}.md`
  const campaign = campaignFor(page, state.campaigns)
  return `${root}/Campanhas/${filePart(campaign?.title ?? "Campanha sem nome", "Campanha")}/${kind}/${name}.md`
}

export function exportKnowledgeZip(state: KnowledgeWorkspaceState): void {
  const files = state.pages.map((page) => ({ name: obsidianPathForPage(page, state), content: pageToMarkdown(page, state) }))
  files.push({ name: "Runas DM/LEIA-ME.md", content: "# Arquivo Runas DM\n\nExportação compatível com Obsidian. Os vínculos entre páginas usam a sintaxe `[[Página]]`.\n" })
  const zip = createTextZip(files)
  const buffer = new ArrayBuffer(zip.byteLength)
  new Uint8Array(buffer).set(zip)
  downloadBlob(new Blob([buffer], { type: "application/zip" }), `runas-dm-obsidian-${new Date().toISOString().slice(0, 10)}.zip`)
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "")
}

function encodedVaultPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/")
}

async function putObsidianFile(path: string, body: BodyInit, contentType: string, connection: ObsidianConnection): Promise<void> {
  const response = await fetch(`${normalizeBaseUrl(connection.baseUrl)}/vault/${encodedVaultPath(path)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${connection.apiKey}`, "Content-Type": contentType, Accept: "application/json" },
    body,
  })
  if (!response.ok) throw new Error(`Falha ao escrever ${path} (${response.status})`)
}

async function pageWithObsidianAttachments(page: KnowledgePage, connection: ObsidianConnection): Promise<KnowledgePage> {
  if (typeof DOMParser === "undefined" || !page.contentHtml.includes("data:image/")) return page
  const documentValue = new DOMParser().parseFromString(page.contentHtml, "text/html")
  const images = [...documentValue.body.querySelectorAll<HTMLImageElement>("img[src^='data:image/']")]
  const attachmentRoot = connection.rootFolder.split("/").map((part) => filePart(part, "Runas DM")).filter(Boolean).join("/")
  for (const [index, image] of images.entries()) {
    const source = image.getAttribute("src")
    if (!source) continue
    const blob = await fetch(source).then((response) => response.blob())
    const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : blob.type === "image/gif" ? "gif" : "jpg"
    const path = `${attachmentRoot}/Anexos/${filePart(page.title, "Imagem")}-${page.id.slice(-8)}-${index + 1}.${extension}`
    await putObsidianFile(path, blob, blob.type || "application/octet-stream", connection)
    image.removeAttribute("src")
    image.setAttribute("data-obsidian-path", path)
  }
  return { ...page, contentHtml: documentValue.body.innerHTML }
}

export async function testObsidianConnection(connection: ObsidianConnection): Promise<void> {
  const response = await fetch(`${normalizeBaseUrl(connection.baseUrl)}/`, { headers: { Authorization: `Bearer ${connection.apiKey}` } })
  if (!response.ok) throw new Error(`Obsidian respondeu com ${response.status}`)
}

export async function syncPageToObsidian(page: KnowledgePage, state: KnowledgeWorkspaceState, connection: ObsidianConnection): Promise<void> {
  const pageWithAttachments = await pageWithObsidianAttachments(page, connection)
  const path = obsidianPathForPage(page, state, connection.rootFolder)
  await putObsidianFile(path, pageToMarkdown(pageWithAttachments, state), "text/markdown; charset=utf-8", connection)
}

export async function syncWorkspaceToObsidian(state: KnowledgeWorkspaceState, connection: ObsidianConnection, onProgress?: (done: number, total: number) => void): Promise<void> {
  await testObsidianConnection(connection)
  let done = 0
  for (const page of state.pages) {
    await syncPageToObsidian(page, state, connection)
    done += 1
    onProgress?.(done, state.pages.length)
  }
}
