import { describe, expect, it } from "vitest"
import { exportEncounterMarkdown, importEncounterMarkdown } from "./encounter-notes"
import { createEmptyCharacter, type EncounterActor, type InitiativeEntry } from "./model"

describe("notas e iniciativa em Markdown", () => {
  it("preserva notas, ordem, margens e vínculo por ID", () => {
    const actor: EncounterActor = { id: "actor-1", sourceId: "sheet-1", copyNumber: 1, character: createEmptyCharacter("Sentinela"), masteryTableId: "default" }
    const initiative: InitiativeEntry[] = [{ id: "init-1", actorId: actor.id, name: "Sentinela", value: 7 }, { id: "init-2", actorId: null, name: "Visitante", value: -2 }]
    const markdown = exportEncounterMarkdown("<p>Texto <strong>importante</strong></p>", initiative)
    const imported = importEncounterMarkdown(markdown, [actor])
    expect(imported.notesHtml).toContain("<strong>importante</strong>")
    expect(imported.initiative.map((entry) => [entry.name, entry.value, entry.actorId])).toEqual([["Sentinela", 7, "actor-1"], ["Visitante", -2, null]])
  })
})
