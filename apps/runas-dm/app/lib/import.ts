import type { Character } from "@runas/core/types/character"
import type { RunasDmState } from "./model"

export type RunasImport =
  | { kind: "workspace"; state: RunasDmState }
  | { kind: "character"; character: Character }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isCharacter(value: unknown): value is Character {
  return isRecord(value)
    && typeof value.name === "string"
    && isRecord(value.info)
    && isRecord(value.attributes)
    && isRecord(value.stats)
    && Array.isArray(value.skills)
    && Array.isArray(value.bonds)
    && Array.isArray(value.abilities)
    && Array.isArray(value.spells)
    && Array.isArray(value.inventory)
    && Array.isArray(value.notes)
}

function isWorkspace(value: unknown): value is RunasDmState {
  return isRecord(value)
    && Array.isArray(value.entries)
    && Array.isArray(value.encounter)
    && Array.isArray(value.masteryTables)
}

/**
 * Aceita backups completos do Runas DM, personagens crus e o envelope
 * `{ version, character }` exportado pelo Runas Tools. O personagem retornado
 * conserva suas coleções estruturadas; nenhuma entidade vira uma lista textual.
 */
export function parseRunasImport(value: unknown): RunasImport {
  if (isWorkspace(value)) return { kind: "workspace", state: value }

  const candidate = isRecord(value) && "character" in value ? value.character : value
  if (isCharacter(candidate)) return { kind: "character", character: candidate }

  throw new Error("O arquivo não contém uma ficha Runas válida.")
}
