import { createCoreSkills } from "@runas/core/data/skills"
import { synchronizeCharacterDerivedValues } from "@runas/core/lib/characterSynchronization"
import type { Character } from "@runas/core/types/character"
import { CHARACTER_VERSION } from "@runas/core/types/character"

export interface BestiaryEntry {
  id: string
  character: Character
  updatedAt: number
}

export interface EncounterActor {
  id: string
  sourceId: string
  copyNumber: number
  character: Character
}

export interface MasteryTable {
  id: string
  name: string
  multiplier: number
}

export interface RunasDmState {
  version: 1
  entries: BestiaryEntry[]
  encounter: EncounterActor[]
  masteryTables: MasteryTable[]
  updatedAt: number
}

export function createEmptyCharacter(name = "Nova criatura"): Character {
  return {
    version: CHARACTER_VERSION,
    name,
    info: {
      currentYear: "424", calendar: "logi", race: "Personalizado", species: "", profession: "",
      sizeBase: "2.00", sizeReal: "2.00", sizeModifier: "0", sizeModifierBonus: "0",
      weightBase: "100", weightBonus: "0", weightReal: "100", scaleMultiplier: "1.0x",
      birthDate: "", age: "", region: "", characterClass: "", archetype: "", essences: "0",
      karma: "0", deity: "", legacy: "", legacyPoints: "0", affinity: "Ordinário (0)",
      efficiency: "0", alignment: "Neutro (0)", legacyRarity: "Comum (+0)", loadBase: "14",
    },
    attributes: {
      physical: 7, mental: 7, mystic: 7, strength: 0, dexterity: 0, vitality: 0,
      intelligence: 0, knowledge: 0, social: 0, faith: 0, power: 0, luck: 0,
    },
    stats: {
      pv: 7, pvBonus: 0, pa: 7, paBonus: 0, pe: 4, peBonus: 0, peTemporary: 4,
      paExtra: 0, paExtraBonus: 0, resistances: [], weaknesses: [], elementId: "none", effects: "",
      determination: 4, determinationBonus: 0, casualty: 4, casualtyBonus: 0, focusCurrent: 35,
      focusModifier: 0, currentLoad: 0, loadBonus: 0, willModifier: 0, chanceModifier: 0,
      perceptionModifier: 0, movementBonus: 0, firstImpressionsBonus: 0, armorRdf: 0,
      armorRdm: 0, naturalRdf: 0, naturalRdm: 0, mt: 0,
      masteryImprovements: { aura: 0, life: 0, energy: 0, determination: 0, casualty: 0 },
    },
    skills: createCoreSkills(), bonds: [], abilities: [], spells: [], inventory: [], notes: [],
  }
}

function sampleSentinel(): Character {
  const character = createEmptyCharacter("Sentinela de Vidro")
  character.info.race = "Constructo"
  character.info.affinity = "Afinidade 3 (Raro)"
  character.info.efficiency = "60"
  character.info.essences = "180"
  character.attributes = { ...character.attributes, physical: 9, mental: 5, mystic: 8, strength: 4, dexterity: 2, vitality: 5, intelligence: 1, knowledge: 3, social: -2, faith: 2, power: 4, luck: 0 }
  character.stats = { ...character.stats, pv: 62, pa: 34, paExtra: 12, pe: 22, peTemporary: 8, elementId: "cristal", resistances: ["Cortante", "Queimadura"], weaknesses: ["Contundente", "Impacto"], armorRdf: 4, armorRdm: 2, movementBonus: 1 }
  character.skills = [...character.skills, { id: "sample-1", name: "Vigilância", attributeKey: "knowledge", points: 10, modifier: 2, locked: false }]
  character.abilities = [
    { id: "ability-1", category: "Racial", name: "Corpo Prismático", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" },
    { id: "ability-2", category: "Combate", name: "Estilhaçar", description: "Explode fragmentos ao redor.", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" },
  ]
  character.inventory = [{ id: "item-1", usage: "equipped", name: "Lança de cristal", type: "weapon", affinity: 2, bondPoints: 0, baseWeight: 3, quantity: 1, applyScaleWeight: false, damage: "4D+2 perfurante", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "sample-1", description: "" }]
  return synchronizeCharacterDerivedValues(character, character)
}

function sampleAshBeast(): Character {
  const character = createEmptyCharacter("Fera das Cinzas")
  character.info.race = "Animal"
  character.info.affinity = "Afinidade 2 (Incomum)"
  character.info.efficiency = "40"
  character.info.essences = "90"
  character.attributes = { ...character.attributes, physical: 10, mental: 3, mystic: 5, strength: 5, dexterity: 4, vitality: 3, intelligence: -2, knowledge: 1, social: -3, faith: 0, power: 2, luck: 1 }
  character.stats = { ...character.stats, pv: 48, pa: 16, pe: 12, peTemporary: 0, elementId: "fogo", resistances: ["Queimadura", "Corrosivo"], weaknesses: ["Congelante"], naturalRdf: 2, movementBonus: 4 }
  character.skills = [...character.skills, { id: "sample-2", name: "Rastreio", attributeKey: "knowledge", points: 6, modifier: 1, locked: false }]
  character.abilities = [{ id: "ability-3", category: "Racial", name: "Faro de Fumaça", description: "", permanentModifiers: "", costType: "none", costMode: "fixed", costValue: 0, costText: "" }]
  character.inventory = [{ id: "item-2", usage: "equipped", name: "Garras em brasa", type: "weapon", affinity: 1, bondPoints: 0, baseWeight: 0, quantity: 1, applyScaleWeight: false, damage: "3D+3 cortante", rdf: 0, rdm: 0, prCurrent: null, prMaximum: null, enchantmentSpellId: "", bondId: "", bondAbilityId: "", skillId: "", description: "" }]
  return synchronizeCharacterDerivedValues(character, character)
}

export function createInitialState(): RunasDmState {
  const now = Date.now()
  return {
    version: 1,
    entries: [
      { id: "sentinela-vidro", character: sampleSentinel(), updatedAt: now },
      { id: "fera-cinzas", character: sampleAshBeast(), updatedAt: now },
    ],
    encounter: [],
    masteryTables: [
      { id: "default", name: "Padrão", multiplier: 1 },
      { id: "double", name: "Pontos dobrados", multiplier: 2 },
    ],
    updatedAt: now,
  }
}

/** Normaliza dados antigos/importados com as regras atuais sem restaurar recursos gastos. */
export function normalizeRunasDmState(state: RunasDmState): RunasDmState {
  return {
    ...state,
    entries: state.entries.map((entry) => ({
      ...entry,
      character: synchronizeCharacterDerivedValues(entry.character, entry.character),
    })),
    encounter: state.encounter.map((actor) => ({
      ...actor,
      character: synchronizeCharacterDerivedValues(actor.character, actor.character),
    })),
  }
}

export function cloneCharacter(character: Character): Character {
  return structuredClone(character)
}

export function actionsAndAbilities(character: Character): string[] {
  return [
    ...character.inventory.filter((item) => item.usage === "equipped").map((item) => item.name),
    ...character.abilities.filter((ability) => ability.category.toLocaleLowerCase("pt-BR") !== "racial").map((ability) => ability.name),
    ...character.spells.map((spell) => `${spell.name} ${spell.category}`.trim()),
  ].filter(Boolean)
}

export function racialCharacteristics(character: Character): string[] {
  return character.abilities
    .filter((ability) => ability.category.toLocaleLowerCase("pt-BR") === "racial")
    .map((ability) => ability.name)
    .filter(Boolean)
}

export function essenceYield(character: Character): number {
  const total = Number(character.info.essences.replace(",", "."))
  return Number.isFinite(total) ? Math.max(0, Math.floor(total / 10)) : 0
}
