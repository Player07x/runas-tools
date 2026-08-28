import type { BestiaryEntry, MasteryTable, RunasDmState } from "./model"
import { normalizeRunasDmState } from "./model"

function normalizeIdentityPart(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR")
}

export function getBestiaryEntryIdentity(entry: BestiaryEntry): string {
  return [
    normalizeIdentityPart(entry.character.name),
    normalizeIdentityPart(entry.character.info.race),
    normalizeIdentityPart(entry.character.stats.elementId),
  ].join("\u0000")
}

function mergeBestiaryEntries(
  existing: BestiaryEntry[],
  incoming: BestiaryEntry[],
  preserveMatchedId: "existing" | "incoming",
): BestiaryEntry[] {
  const merged = existing.map((entry) => structuredClone(entry))
  const indexByIdentity = new Map(merged.map((entry, index) => [getBestiaryEntryIdentity(entry), index]))

  for (const incomingEntry of incoming) {
    const identity = getBestiaryEntryIdentity(incomingEntry)
    const existingIndex = indexByIdentity.get(identity)

    if (existingIndex === undefined) {
      indexByIdentity.set(identity, merged.length)
      merged.push(structuredClone(incomingEntry))
      continue
    }

    const existingEntry = merged[existingIndex]
    merged[existingIndex] = {
      ...structuredClone(incomingEntry),
      id: preserveMatchedId === "existing" ? existingEntry.id : incomingEntry.id,
    }
  }

  return merged
}

function mergeMasteryTables(existing: MasteryTable[], incoming: MasteryTable[]): MasteryTable[] {
  const merged = existing.map((table) => ({ ...table }))
  const knownIds = new Set(merged.map((table) => table.id))

  for (const table of incoming) {
    if (!knownIds.has(table.id)) {
      knownIds.add(table.id)
      merged.push({ ...table })
    }
  }

  return merged
}

/**
 * Aplica as fichas do backup sobre as fichas locais. Somente nome, raça e
 * elemento iguais formam um conflito; fichas exclusivas dos dois lados ficam
 * salvas. O restante do espaço de trabalho local permanece intacto.
 */
export function synchronizeRunasDmState(local: RunasDmState, backup: RunasDmState, now = Date.now()): RunasDmState {
  const normalizedBackup = normalizeRunasDmState(backup)
  const masteryTables = mergeMasteryTables(local.masteryTables, normalizedBackup.masteryTables)
  return normalizeRunasDmState({
    ...local,
    entries: mergeBestiaryEntries(local.entries, normalizedBackup.entries, "existing"),
    masteryTables,
    updatedAt: now,
  })
}

/**
 * Monta o snapshot remoto com todas as fichas já armazenadas e todas as fichas
 * locais. Em conflitos por nome + raça + elemento, a versão local vence.
 */
export function createRunasDmBackup(local: RunasDmState, remote: RunasDmState | null, now = Date.now()): RunasDmState {
  if (!remote) return { ...normalizeRunasDmState(local), updatedAt: now }

  const normalizedRemote = normalizeRunasDmState(remote)
  const masteryTables = mergeMasteryTables(normalizedRemote.masteryTables, local.masteryTables)
  return normalizeRunasDmState({
    ...local,
    entries: mergeBestiaryEntries(normalizedRemote.entries, local.entries, "incoming"),
    masteryTables,
    updatedAt: now,
  })
}
