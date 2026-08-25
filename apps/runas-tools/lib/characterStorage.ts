import type { Character, CharacterSaveFile } from "@runas/core/types/character"
import { CHARACTER_VERSION } from "@runas/core/types/character"
import {
  createEmptyCharacter,
  normalizeCharacter,
  parseCharacterFile,
} from "@runas/core/lib/characterStorage"

export { createEmptyCharacter, normalizeCharacter, parseCharacterFile }

export const STORAGE_KEY = "runas.character.v1"

export function loadCharacter(): Character | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CharacterSaveFile
    return normalizeCharacter(parsed.character)
  } catch {
    return null
  }
}

export function saveCharacter(character: Character): void {
  if (typeof window === "undefined") return
  try {
    const file: CharacterSaveFile = { version: CHARACTER_VERSION, character }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  } catch {
    // Ignora falhas de escrita (ex: modo privado / cota cheia).
  }
}
