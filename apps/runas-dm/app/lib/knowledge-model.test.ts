import { describe, expect, it } from "vitest"
import { CAMPAIGN_STATUSES, createKnowledgePage, mergeKnowledgeWorkspaces, normalizeKnowledgeWorkspace, parseList, wikiLinkTitles } from "./knowledge-model"

describe("knowledge model", () => {
  it("mantém os status definidos pelo produto e normaliza referências de encontro", () => {
    expect(CAMPAIGN_STATUSES).toEqual([
      "Sem Status",
      "Não Iniciada",
      "Em Progresso",
      "Concluída",
      "Fracassada",
      "Parcialmente Concluída",
      "Parcialmente Fracassada",
    ])
    const state = normalizeKnowledgeWorkspace({
      pages: [{
        id: "page-1",
        kind: "encounter",
        status: "status inválido",
        encounterCreatures: [
          { entryId: "wolf", name: "Lobo", quantity: 120 },
          { entryId: "crow", name: "Corvo", quantity: 0 },
        ],
      }],
    })
    expect(state.pages[0].status).toBe("Sem Status")
    expect(state.pages[0].encounterCreatures.map((item) => item.quantity)).toEqual([99, 1])
    expect(createKnowledgePage("campaign", "encounter", "campaign-1").title).toBe("Novo encontro")
  })

  it("deduplica filtros e encontra links no formato do Obsidian", () => {
    expect(parseList("vilão, sessão 4, vilão\nreino")).toEqual(["vilão", "sessão 4", "reino"])
    expect(wikiLinkTitles("[[Zotera]] e [[A Queda|evento]], além de [[Zotera#Origem]]")).toEqual(["Zotera", "A Queda", "Zotera"])
  })

  it("mescla snapshots sem apagar registros exclusivos", () => {
    const local = normalizeKnowledgeWorkspace({
      updatedAt: 10,
      campaigns: [{ id: "local", title: "Local", createdAt: 1, updatedAt: 10 }],
    })
    const remote = normalizeKnowledgeWorkspace({
      updatedAt: 20,
      campaigns: [{ id: "remote", title: "Remota", createdAt: 2, updatedAt: 20 }],
    })
    expect(mergeKnowledgeWorkspaces(local, remote).campaigns.map((campaign) => campaign.id).sort()).toEqual(["local", "remote"])
  })
})
