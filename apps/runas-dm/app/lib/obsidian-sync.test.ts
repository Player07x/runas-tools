import { describe, expect, it } from "vitest"
import { normalizeKnowledgeWorkspace, type KnowledgePage } from "./knowledge-model"
import { obsidianPathForPage, pageToMarkdown } from "./obsidian-sync"

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
    expect(obsidianPathForPage(state.pages[0], state, "Ordem x Caos")).toBe("Ordem x Caos/Campanhas/A Queda de Zotera/Missao/Portoes do Norte.md")
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
})
