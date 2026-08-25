import type { CharacterSkill, SecondaryAttributeKey } from "../types/character"
import type { SpecialDieId } from "../types/skillTest"

export interface SystemSkillDefinition {
  name: string
  attributeKey: SecondaryAttributeKey
  aliases?: string[]
}

export const CORE_SKILL_IDS = {
  will: "core-will",
  chance: "core-chance",
  perception: "core-perception",
} as const

export const systemSkills: SystemSkillDefinition[] = [
  { name: "Vontade", attributeKey: "faith" },
  { name: "Acaso", attributeKey: "luck" },
  { name: "Percepção", attributeKey: "knowledge", aliases: ["percepcao"] },
  { name: "Iniciativa", attributeKey: "dexterity" },
  { name: "Reflexo", attributeKey: "dexterity", aliases: ["reflexos"] },
  { name: "Lâminas", attributeKey: "dexterity", aliases: ["lamina", "laminas"] },
  { name: "Hastes", attributeKey: "dexterity", aliases: ["haste"] },
  { name: "Contundentes", attributeKey: "dexterity", aliases: ["contundente"] },
  { name: "Flexíveis", attributeKey: "dexterity", aliases: ["flexivel", "flexiveis"] },
  { name: "Improvisadas", attributeKey: "dexterity", aliases: ["improvisada", "improvisadas"] },
  { name: "Arremesso", attributeKey: "dexterity" },
  { name: "Disparo", attributeKey: "dexterity" },
  { name: "Briga", attributeKey: "strength" },
  { name: "Luta", attributeKey: "strength" },
  { name: "Forja", attributeKey: "intelligence" },
  { name: "Alquimia", attributeKey: "knowledge" },
  { name: "Poções", attributeKey: "knowledge", aliases: ["pocoes", "poção", "pocao"] },
  { name: "Engenharia", attributeKey: "intelligence" },
  { name: "Economia", attributeKey: "knowledge" },
  { name: "Medicina", attributeKey: "knowledge" },
  { name: "Sobrevivência", attributeKey: "knowledge", aliases: ["sobrevivencia"] },
  { name: "Rastreio", attributeKey: "knowledge", aliases: ["rastrear"] },
  { name: "Furtividade", attributeKey: "dexterity" },
  { name: "Ladinagem", attributeKey: "dexterity" },
  { name: "Persuasão", attributeKey: "social", aliases: ["persuasao"] },
  { name: "Intimidação", attributeKey: "social", aliases: ["intimidacao"] },
  { name: "Enganação", attributeKey: "social", aliases: ["enganacao"] },
  { name: "Atuação", attributeKey: "social", aliases: ["atuacao"] },
  { name: "Arcano", attributeKey: "power", aliases: ["arcanismo"] },
  { name: "Conjuração", attributeKey: "power", aliases: ["conjuracao"] },
  { name: "Religião", attributeKey: "faith", aliases: ["religiao"] },
]

export const specialDice: { id: SpecialDieId; label: string; aliases: string[] }[] = [
  { id: "none", label: "Nenhum", aliases: ["nenhum", "nao"] },
  { id: "luck", label: "Dado de Sorte", aliases: ["sorte"] },
  { id: "inspiration", label: "Dado de Inspiração", aliases: ["inspiracao", "inspiração"] },
  {
    id: "legendary-inspiration",
    label: "Inspiração Lendária",
    aliases: ["inspiracao lendaria", "inspiração lendária", "lendario", "lendária", "lendaria"],
  },
  {
    id: "jera-distrust",
    label: "Desconfiança de Jera",
    aliases: ["desconfianca de jera", "desconfiança de jera", "jera"],
  },
  {
    id: "divine-advantage",
    label: "Dado Divino (Vantagem)",
    aliases: ["divino vantagem", "vantagem", "dado divino vantagem"],
  },
  {
    id: "divine-disadvantage",
    label: "Dado Divino (Desvantagem)",
    aliases: ["divino desvantagem", "desvantagem", "dado divino desvantagem"],
  },
  { id: "joke", label: "Dado de Piada", aliases: ["piada"] },
]

export function createCoreSkills(modifiers?: Partial<Record<"will" | "chance" | "perception", number>>): CharacterSkill[] {
  return [
    {
      id: CORE_SKILL_IDS.will,
      name: "Vontade",
      attributeKey: "faith",
      points: 0,
      modifier: modifiers?.will ?? 0,
      locked: true,
    },
    {
      id: CORE_SKILL_IDS.chance,
      name: "Acaso",
      attributeKey: "luck",
      points: 0,
      modifier: modifiers?.chance ?? 0,
      locked: true,
    },
    {
      id: CORE_SKILL_IDS.perception,
      name: "Percepção",
      attributeKey: "knowledge",
      points: 0,
      modifier: modifiers?.perception ?? 0,
      locked: true,
    },
  ]
}
