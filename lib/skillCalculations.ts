import { damageAttributes, attributeGroups } from "@/data/attributes"
import { specialDice, systemSkills } from "@/data/skills"
import type { CharacterAttributes, CharacterSkill, SecondaryAttributeKey } from "@/types/character"
import type {
  ParsedSkillExpression,
  SkillRoll,
  SkillRollOutcome,
  SkillTestConfig,
  SpecialDieId,
} from "@/types/skillTest"

const SKILL_LEVEL_THRESHOLDS = [0, 3, 6, 10, 15, 21, 28] as const

export function normalizeSkillName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function matchesName(input: string, candidates: string[]): boolean {
  const normalized = normalizeSkillName(input)
  const normalizedCandidates = candidates.map(normalizeSkillName)
  if (normalizedCandidates.includes(normalized)) return true
  if (normalized.length < 3) return false
  return normalizedCandidates.some((candidate) => candidate.startsWith(normalized) || normalized.startsWith(candidate))
}

export function calculateSkillLevel(pointsValue: number): number {
  const points = Math.max(0, Math.floor(Number.isFinite(pointsValue) ? pointsValue : 0))
  let level = 0
  for (let index = 1; index < SKILL_LEVEL_THRESHOLDS.length; index += 1) {
    if (points >= SKILL_LEVEL_THRESHOLDS[index]) level = index
  }
  return level
}

export function calculateSkillModifier(skill: Pick<CharacterSkill, "points" | "modifier">): number {
  return calculateSkillLevel(skill.points) + (Number.isFinite(skill.modifier) ? skill.modifier : 0)
}

export function getPrimaryAttributeKey(attributeKey: SecondaryAttributeKey): "physical" | "mental" | "mystic" {
  const group = attributeGroups.find((item) => item.attributes.some((attribute) => attribute.key === attributeKey))
  return group?.id ?? "physical"
}

export function calculateAttributeTest(attributes: CharacterAttributes, attributeKey: SecondaryAttributeKey): number {
  return attributes[getPrimaryAttributeKey(attributeKey)] + attributes[attributeKey]
}

export function findCharacterSkill(skills: CharacterSkill[], name: string): CharacterSkill | undefined {
  const exact = skills.find((skill) => normalizeSkillName(skill.name) === normalizeSkillName(name))
  if (exact) return exact
  if (normalizeSkillName(name).length < 3) return undefined
  const partial = skills.filter((skill) => matchesName(name, [skill.name]))
  return partial.length === 1 ? partial[0] : undefined
}

export function findSystemSkill(name: string) {
  const exact = systemSkills.find((skill) => matchesName(name, [skill.name, ...(skill.aliases ?? [])]))
  return exact
}

export function findSpecialDie(name: string): SpecialDieId {
  if (!name.trim()) return "none"
  const match = specialDice.find((die) => matchesName(name, [die.label, ...die.aliases]))
  return match?.id ?? "none"
}

export function parseSkillExpression(input: string, skills: CharacterSkill[]): ParsedSkillExpression {
  const empty: ParsedSkillExpression = {
    attributeKey: "",
    skillName: "",
    skillModifier: 0,
    masterModifier: 0,
    specialDieId: "none",
    source: "empty",
  }
  if (!input.trim()) return empty

  const specialMatch = input.match(/\(([^()]*)\)\s*$/)
  const specialDieId = findSpecialDie(specialMatch?.[1] ?? "")
  const withoutSpecial = specialMatch ? input.slice(0, specialMatch.index).trim() : input.trim()
  const modifierMatch = withoutSpecial.match(/([+-])\s*(\d+)\s*$/)
  const masterModifier = modifierMatch
    ? Number(modifierMatch[2]) * (modifierMatch[1] === "-" ? -1 : 1)
    : 0
  const term = modifierMatch ? withoutSpecial.slice(0, modifierMatch.index).trim() : withoutSpecial
  if (!term) return { ...empty, masterModifier, specialDieId }

  const attribute = damageAttributes.find((item) => matchesName(term, [item.name, item.abbr, ...item.aliases]))
  if (attribute) {
    return {
      ...empty,
      attributeKey: attribute.key as SecondaryAttributeKey,
      masterModifier,
      specialDieId,
      source: "attribute",
    }
  }

  const characterSkill = findCharacterSkill(skills, term)
  if (characterSkill) {
    return {
      attributeKey: characterSkill.attributeKey,
      skillName: characterSkill.name,
      skillModifier: calculateSkillModifier(characterSkill),
      masterModifier,
      specialDieId,
      source: "character-skill",
    }
  }

  const systemSkill = findSystemSkill(term)
  if (systemSkill) {
    return {
      attributeKey: systemSkill.attributeKey,
      skillName: systemSkill.name,
      skillModifier: -3,
      masterModifier,
      specialDieId,
      source: "system-skill",
    }
  }

  return {
    attributeKey: "",
    skillName: term.slice(0, 30),
    skillModifier: -3,
    masterModifier,
    specialDieId,
    source: "exclusive-skill",
  }
}

function randomInteger(max: number, random: () => number): number {
  return Math.floor(random() * max) + 1
}

export function determineSkillRollOutcome(diceRolls: [number, number], margin: number): SkillRollOutcome {
  if (diceRolls[0] === 1 && diceRolls[1] === 1) return "critical-success"
  if (diceRolls[0] === 10 && diceRolls[1] === 10) return "critical-failure"
  return margin >= 0 ? "success" : "failure"
}

export function rollSkillTest({
  config,
  attributes,
  random = Math.random,
  id = `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  now = Date.now(),
}: {
  config: SkillTestConfig
  attributes: CharacterAttributes
  random?: () => number
  id?: string
  now?: number
}): SkillRoll | null {
  if (!config.attributeKey) return null

  let diceRolls: [number, number]
  if (config.specialDieId === "legendary-inspiration") {
    diceRolls = [1, 1]
  } else if (config.specialDieId === "inspiration") {
    diceRolls = [1, randomInteger(10, random)]
  } else {
    diceRolls = [randomInteger(10, random), randomInteger(10, random)]
  }

  let specialModifier = 0
  const normalizedSkill = normalizeSkillName(config.skillName)
  if (config.specialDieId === "jera-distrust" && normalizedSkill === "iniciativa") {
    specialModifier = 4
  } else if (config.specialDieId === "divine-advantage") {
    specialModifier = randomInteger(6, random)
  } else if (config.specialDieId === "divine-disadvantage") {
    specialModifier = -randomInteger(6, random)
  } else if (config.specialDieId === "joke" && config.attributeKey === "social") {
    specialModifier = randomInteger(6, random)
  }

  const baseTest = calculateAttributeTest(attributes, config.attributeKey)
  const totalModifiers = config.skillModifier + config.masterModifier + config.otherModifiers + specialModifier
  const totalTest = baseTest + totalModifiers
  const diceSum = diceRolls[0] + diceRolls[1]
  const margin = totalTest - diceSum

  return {
    id,
    createdAt: now,
    diceRolls,
    diceSum,
    baseTest,
    skillName: config.skillName,
    attributeKey: config.attributeKey,
    skillModifier: config.skillModifier,
    masterModifier: config.masterModifier,
    otherModifiers: config.otherModifiers,
    specialModifier,
    totalModifiers,
    totalTest,
    margin,
    outcome: determineSkillRollOutcome(diceRolls, margin),
    specialDieId: config.specialDieId,
    determinationUses: 0,
  }
}

export function applyDeterminationToRoll(roll: SkillRoll): SkillRoll {
  const modifier = normalizeSkillName(roll.skillName) === "vontade" ? 3 : 1
  const totalModifiers = roll.totalModifiers + modifier
  const totalTest = roll.totalTest + modifier
  const margin = totalTest - roll.diceSum
  return {
    ...roll,
    totalModifiers,
    totalTest,
    margin,
    outcome: determineSkillRollOutcome(roll.diceRolls, margin),
    determinationUses: roll.determinationUses + 1,
  }
}

function outcomeRank(outcome: SkillRollOutcome): number {
  if (outcome === "critical-success") return 3
  if (outcome === "success") return 2
  if (outcome === "failure") return 1
  return 0
}

export function compareSkillRolls(left: SkillRoll, right: SkillRoll): number {
  const rankDifference = outcomeRank(left.outcome) - outcomeRank(right.outcome)
  return rankDifference || left.margin - right.margin || right.diceSum - left.diceSum
}

export function getBestSkillRoll(rolls: SkillRoll[]): SkillRoll | null {
  return rolls.reduce<SkillRoll | null>((best, roll) => !best || compareSkillRolls(roll, best) > 0 ? roll : best, null)
}

export function formatSkillRollOutcome(roll: Pick<SkillRoll, "outcome" | "margin">): string {
  if (roll.outcome === "critical-success") return "Sucesso Crítico"
  if (roll.outcome === "critical-failure") return "Fracasso Crítico"
  return `${roll.outcome === "success" ? "Sucesso" : "Fracasso"} por ${roll.margin >= 0 ? "+" : ""}${roll.margin}`
}
