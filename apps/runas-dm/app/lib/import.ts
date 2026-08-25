import type { Character } from "@runas/core/types/character"
import { normalizeCharacter } from "@runas/core/lib/characterStorage"
import type { RunasDmState } from "./model"

export type RunasImport =
  | { kind: "workspace"; state: RunasDmState }
  | { kind: "character"; character: Character }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function looksLikeCharacter(value: unknown): value is Partial<Character> {
  return isRecord(value)
    && (typeof value.name === "string" || isRecord(value.info))
    && (isRecord(value.attributes) || isRecord(value.stats))
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
  if (looksLikeCharacter(candidate)) return { kind: "character", character: normalizeCharacter(candidate) }

  throw new Error("O arquivo não contém uma ficha Runas válida.")
}
