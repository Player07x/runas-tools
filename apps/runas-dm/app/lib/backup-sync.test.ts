import { describe, expect, it } from "vitest"
import type { BestiaryEntry, RunasDmState } from "./model"
import { createEmptyCharacter, createInitialState } from "./model"
import { createRunasDmBackup, synchronizeRunasDmState } from "./backup-sync"

function entry(id: string, name: string, race: string, elementId: string, marker: string): BestiaryEntry {
  const character = createEmptyCharacter(name)
  character.info.race = race
  character.stats.elementId = elementId
  character.info.profession = marker
  return { id, character, masteryTableId: "default", updatedAt: 1 }
}

function state(entries: BestiaryEntry[]): RunasDmState {
  return { ...createInitialState(), entries, encounter: [], updatedAt: 1 }
}

describe("sincronização do backup do Runas DM", () => {
  it("substitui a ficha local com mesmo nome, raça e elemento e preserva as fichas exclusivas", () => {
    const local = state([
      entry("local-a", "Ficha A", "Humano", "fogo", "local A"),
      entry("local-b", "Ficha B", "Elfo", "agua", "local B"),
      entry("local-c", "Ficha C", "Anão", "terra", "local C"),
    ])
    local.encounter = [{ id: "actor-c", sourceId: "local-c", copyNumber: 1, character: local.entries[2].character, masteryTableId: "default" }]
    const backup = state([
      entry("remote-c", "Ficha C", "Anão", "terra", "backup C"),
      entry("remote-d", "Ficha D", "Orc", "ar", "backup D"),
    ])

    const synchronized = synchronizeRunasDmState(local, backup, 10)

    expect(synchronized.entries.map(({ character }) => character.name)).toEqual(["Ficha A", "Ficha B", "Ficha C", "Ficha D"])
    expect(synchronized.entries.find(({ character }) => character.name === "Ficha C")?.character.info.profession).toBe("backup C")
    expect(synchronized.entries.find(({ character }) => character.name === "Ficha C")?.id).toBe("local-c")
    expect(synchronized.encounter[0]?.sourceId).toBe("local-c")
  })

  it("considera diferente quando nome, raça ou elemento não coincidem", () => {
    const local = state([entry("base", "Sentinela", "Constructo", "cristal", "base")])
    const backup = state([
      entry("name", "Outra Sentinela", "Constructo", "cristal", "nome"),
      entry("race", "Sentinela", "Humano", "cristal", "raça"),
      entry("element", "Sentinela", "Constructo", "fogo", "elemento"),
    ])

    expect(synchronizeRunasDmState(local, backup).entries).toHaveLength(4)
  })

  it("compara nome, raça e elemento sem diferenciar caixa ou espaços excedentes", () => {
    const local = state([entry("local", "  Ficha   C ", "ANÃO", "TERRA", "local")])
    const backup = state([entry("remote", "ficha c", "anão", "terra", "backup")])

    const synchronized = synchronizeRunasDmState(local, backup)

    expect(synchronized.entries).toHaveLength(1)
    expect(synchronized.entries[0].character.info.profession).toBe("backup")
  })

  it("ao fazer backup mantém fichas remotas exclusivas e usa a ficha local nos conflitos", () => {
    const remote = state([
      entry("remote-c", "Ficha C", "Anão", "terra", "backup antigo"),
      entry("remote-d", "Ficha D", "Orc", "ar", "somente remoto"),
    ])
    const local = state([
      entry("local-a", "Ficha A", "Humano", "fogo", "somente local"),
      entry("local-c", "Ficha C", "Anão", "terra", "local recente"),
    ])

    const backup = createRunasDmBackup(local, remote, 10)

    expect(backup.entries.map(({ character }) => character.name)).toEqual(["Ficha C", "Ficha D", "Ficha A"])
    expect(backup.entries.find(({ character }) => character.name === "Ficha C")?.character.info.profession).toBe("local recente")
    expect(backup.entries.find(({ character }) => character.name === "Ficha C")?.id).toBe("local-c")
  })
})
