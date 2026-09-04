import { describe, expect, it } from "vitest"
import { normalizeKnowledgeWorkspace, type KnowledgePage } from "./knowledge-model"
import { mergeObsidianNotes, obsidianPathForPage, pageObsidianFingerprint, pageToMarkdown, synchronizeWorkspaceWithVault, type VaultAdapter } from "./obsidian-sync"

describe("Obsidian export", () => {
  const state = normalizeKnowledgeWorkspace({
    campaigns: [{ id: "campaign-1", title: "A Queda de Zotera", description: "", tags: [], createdAt: 1, updatedAt: 1 }],
    categories: [{ id: "category-1", scope: "campaign", campaignId: "campaign-1", name: "Capítulo Um", parentId: null }],
    pages: [
      {
        id: "page-1",
        scope: "campaign",
        campaignId: "campaign-1",
        kind: "mission",
        title: "Portões do Norte",
        summary: "Impedir a invasão.",
        contentHtml: "<p>Defender a muralha.</p>",
        status: "Em Progresso",
        date: "2026-09-02",
        tags: ["Zotera"],
        categoryIds: ["category-1"],
        linkedPageIds: ["page-2"],
        encounterCreatures: [{ entryId: "wolf", name: "Lobo Rúnico", quantity: 3 }],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: "page-2",
        scope: "wiki",
        campaignId: null,
        kind: "geography",
        title: "Zotera",
        contentHtml: "",
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    updatedAt: 1,
  })

  it("gera caminhos relativos ao vault", () => {
    expect(obsidianPathForPage(state.pages[0], state, "Ordem x Caos")).toBe("Ordem x Caos/Portoes do Norte.md")
  })

  it("preserva metadados, vínculos e fichas do encontro no Markdown", () => {
    const markdown = pageToMarkdown(state.pages[0] as KnowledgePage, state)
    expect(markdown).toContain('status: "Em Progresso"')
    expect(markdown).toContain('categorias: ["Capítulo Um"]')
    expect(markdown).toContain("[[Zotera]]")
    expect(markdown).toContain("3× Lobo Rúnico")
  })

  it("exporta encontro como composição de fichas e notas, sem conteúdo de wiki", () => {
    const encounter = {
      ...state.pages[0],
      kind: "encounter" as const,
      title: "Emboscada da ponte",
      summary: "Atacar quando o grupo cruzar o rio.",
      contentHtml: "<p>Texto antigo que não pertence ao encontro.</p>",
    }
    const markdown = pageToMarkdown(encounter, state)
    expect(markdown).toContain("## Notas do mestre")
    expect(markdown).toContain("Atacar quando o grupo cruzar o rio.")
    expect(markdown).not.toContain("Texto antigo")
    expect(markdown).toContain("3× Lobo Rúnico")
  })

  it("importa Markdown comum do vault sem alterar o conteúdo nem o caminho", () => {
    const markdown = "# Castelo de Zotera\n\nUm arquivo antigo que precisa continuar intacto.\n\nVeja [[Portões do Norte]].\n"
    const merged = mergeObsidianNotes(state, [{ path: "Lore/Castelo de Zotera.md", markdown, createdAt: 5, modifiedAt: 10 }])
    const page = merged.state.pages.find((candidate) => candidate.title === "Castelo de Zotera")
    expect(page).toMatchObject({ scope: "wiki", kind: "chronology", obsidianPath: "Lore/Castelo de Zotera.md", obsidianSourceMarkdown: markdown })
    expect(page?.linkedPageIds).toContain("page-1")
    expect(pageToMarkdown(page!, merged.state)).toBe(markdown)
  })

  it("lê antes de gravar, cria páginas na raiz e preserva colisões", async () => {
    const files = new Map<string, string>([["Portoes do Norte.md", "# Documento pessoal\n\nNão substituir sem cópia.\n"]])
    const adapter: VaultAdapter = {
      listMarkdownFiles: async () => [...files.keys()].filter((path) => path.endsWith(".md")),
      readNote: async (path) => ({ path, markdown: files.get(path)!, createdAt: 1, modifiedAt: 2 }),
      writeText: async (path, content) => { files.set(path, content) },
      writeBinary: async () => undefined,
    }
    const result = await synchronizeWorkspaceWithVault(state, adapter)
    expect(files.get("Portoes do Norte.md")).toBe("# Documento pessoal\n\nNão substituir sem cópia.\n")
    expect([...files.keys()]).toContain("Portoes do Norte (page-1).md")
    expect(result.state.pages.some((page) => page.title === "Documento pessoal")).toBe(true)
  })

  it("cria backup e cópia de conflito quando site e vault mudaram", async () => {
    const local = structuredClone(state)
    const page = local.pages[0]
    page.obsidianPath = "Portoes.md"
    page.obsidianSourceMarkdown = "# Versão inicial\n"
    page.obsidianFingerprint = pageObsidianFingerprint(page, local)
    page.contentHtml = "<p>Alteração local importante.</p>"
    page.updatedAt = 100
    const files = new Map<string, string>([["Portoes.md", "# Alteração feita no Obsidian\n"]])
    const adapter: VaultAdapter = {
      listMarkdownFiles: async () => ["Portoes.md"],
      readNote: async (path) => ({ path, markdown: files.get(path)!, createdAt: 1, modifiedAt: 50 }),
      writeText: async (path, content) => { files.set(path, content) },
      writeBinary: async () => undefined,
    }
    const result = await synchronizeWorkspaceWithVault(local, adapter)
    expect(result.backups).toBe(1)
    expect([...files.keys()].some((path) => path.startsWith("Assets/Runas DM Backups/Portoes-"))).toBe(true)
    expect(result.state.pages.some((candidate) => candidate.title.includes("cópia local em conflito"))).toBe(true)
  })
})
