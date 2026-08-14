export type AttributeKey =
  | "physical"
  | "mental"
  | "mystic"
  | "strength"
  | "dexterity"
  | "vitality"
  | "intelligence"
  | "knowledge"
  | "social"
  | "faith"
  | "power"
  | "luck"

export type CharacterCalendar = "logi" | "ce"

export interface CharacterInfo {
  currentYear: string
  calendar: CharacterCalendar
  race: string
  species: string
  profession: string
  size: string
  sizeModifier: string
  sizeModifierBonus: string
  weight: string
  weightMultiplier: string
  weightMultiplierBonus: string
  birthDate: string
  age: string
  region: string
  characterClass: string
  archetype: string
  essences: string
  karma: string
  deity: string
  legacy: string
  legacyPoints: string
  affinity: string
  efficiency: string
  alignment: string
  legacyRarity: string
  loadBase: string
}

export type CharacterAttributes = Record<AttributeKey, number>

export interface CharacterStats {
  pv: number
  pa: number
  pe: number
  mt: number
}

export interface Character {
  version: number
  name: string
  info: CharacterInfo
  attributes: CharacterAttributes
  stats: CharacterStats
}

/**
 * Formato de arquivo salvo (save manual da ficha).
 * Mantido versionado para permitir migrações futuras.
 */
export interface CharacterSaveFile {
  version: number
  character: Character
}

export const CHARACTER_VERSION = 3
