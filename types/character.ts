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
  sizeBase: string
  sizeReal: string
  sizeModifier: string
  sizeModifierBonus: string
  weightBase: string
  weightBonus: string
  weightReal: string
  scaleMultiplier: string
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

export type SecondaryAttributeKey = Exclude<AttributeKey, "physical" | "mental" | "mystic">

export interface CharacterSkill {
  id: string
  name: string
  attributeKey: SecondaryAttributeKey | ""
  points: number
  modifier: number
  locked: boolean
}

export interface CharacterStats {
  pv: number
  pvBonus: number
  pa: number
  paBonus: number
  pe: number
  peBonus: number
  peTemporary: number
  paExtra: number
  paExtraBonus: number
  resistances: string[]
  weaknesses: string[]
  elementId: string
  effects: string
  determination: number
  determinationBonus: number
  casualty: number
  casualtyBonus: number
  focusCurrent: number
  focusModifier: number
  currentLoad: number
  loadBonus: number
  willModifier: number
  chanceModifier: number
  perceptionModifier: number
  movementBonus: number
  firstImpressionsBonus: number
  armorRdf: number
  armorRdm: number
  naturalRdf: number
  naturalRdm: number
  mt: number
}

export interface Character {
  version: number
  name: string
  info: CharacterInfo
  attributes: CharacterAttributes
  stats: CharacterStats
  skills: CharacterSkill[]
}

/**
 * Formato de arquivo salvo (save manual da ficha).
 * Mantido versionado para permitir migrações futuras.
 */
export interface CharacterSaveFile {
  version: number
  character: Character
}

export const CHARACTER_VERSION = 9
