import type { CharacterAbility, CharacterAttributes, CharacterInfo, CharacterSkill, CharacterStats } from "@/types/character"
import { CORE_SKILL_IDS, createCoreSkills } from "@/data/skills"
import { calculateAttributeTest, calculateSkillModifier } from "@/lib/skillCalculations"
import { sumAbilityModifiers } from "@/lib/abilityModifiers"

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function nonNegative(value: number): number {
  return Math.max(0, finite(value))
}

function parseLevel(value: string): number {
  const match = value.match(/\((-?\d+)\)\s*$/)
  return match ? Math.abs(Number(match[1])) : 0
}

function parseDecimal(value: string): number {
  const parsed = Number(value.trim().replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

export interface CharacterStatSnapshot {
  pvMax: number
  paMax: number
  peMax: number
  peTemporaryMax: number
  paExtraMax: number
  determinationMax: number
  casualtyMax: number
  loadCapacity: number
  overweightLevel: number
  physicalPenalty: number
  movementPenalty: number
  overweightWarnings: string[]
  willTest: number
  chanceTest: number
  perceptionTest: number
  knowledgeTest: number
  movement: number
  firstImpressions: number
  focusMaximum: number
  restMinutes: number
}

export function calculateCharacterStatSnapshot(
  attributes: CharacterAttributes,
  info: CharacterInfo,
  stats: CharacterStats,
  skills: CharacterSkill[] = createCoreSkills(),
  abilities: CharacterAbility[] = [],
): CharacterStatSnapshot {
  const abilityModifiers = sumAbilityModifiers(abilities)
  const affinityLevel = parseLevel(info.affinity)
  const alignmentLevel = parseLevel(info.alignment)
  const karma = parseDecimal(info.karma)
  const karmaDirection = karma > 0 ? 1 : karma < 0 ? -1 : 0

  const mastery = stats.masteryImprovements
  const pvMax = Math.max(0, attributes.physical + 2 * attributes.vitality + finite(stats.pvBonus) + abilityModifiers.pv + nonNegative(mastery.life))
  const paMax = Math.max(
    0,
    attributes.mystic +
      attributes.power +
      affinityLevel * Math.ceil(attributes.power / 2) +
      finite(stats.paBonus) + abilityModifiers.pa + nonNegative(mastery.aura),
  )
  const peMax = Math.max(
    0,
    Math.ceil(attributes.mystic / 2) +
      Math.ceil(attributes.power / 2) +
      affinityLevel * Math.ceil(attributes.power / 4) +
      finite(stats.peBonus) + abilityModifiers.pe + nonNegative(mastery.energy),
  )
  const defaultCoreSkills = createCoreSkills()
  const coreSkillTest = (id: string, fallbackIndex: number) => {
    const skill = skills.find((item) => item.id === id) ?? defaultCoreSkills[fallbackIndex]
    const attributeTest = skill.attributeKey ? calculateAttributeTest(attributes, skill.attributeKey) : 0
    return Math.max(0, attributeTest + calculateSkillModifier(skill))
  }
  const willSkillTest = coreSkillTest(CORE_SKILL_IDS.will, 0)
  const chanceSkillTest = coreSkillTest(CORE_SKILL_IDS.chance, 1)
  const determinationMax = Math.max(
    0,
    Math.ceil(willSkillTest / 2) +
      finite(stats.determinationBonus) +
      karmaDirection * alignmentLevel + abilityModifiers.determination + nonNegative(mastery.determination),
  )
  const casualtyMax = Math.max(
    0,
    Math.ceil(chanceSkillTest / 2) +
      finite(stats.casualtyBonus) -
      karmaDirection * alignmentLevel + abilityModifiers.casualty + nonNegative(mastery.casualty),
  )

  const loadCapacity = Math.max(0, parseDecimal(info.loadBase) + finite(stats.loadBonus) + abilityModifiers.load)
  const currentLoad = nonNegative(stats.currentLoad)
  const overweightLevel = loadCapacity > 0
    ? Math.max(0, Math.ceil(currentLoad / loadCapacity) - 1)
    : 0
  const physicalPenalty = overweightLevel * 2
  const mt = finite(stats.mt)
  const movementPenalty = Math.max(
    0,
    mt > 0
      ? Math.ceil(physicalPenalty * (mt === 1 ? 1.5 : mt))
      : mt < 0
        ? physicalPenalty + mt
        : physicalPenalty,
  )
  const overweightWarnings: string[] = []
  if (physicalPenalty >= attributes.physical + attributes.strength) overweightWarnings.push("Esmagado")
  if (physicalPenalty >= attributes.physical + attributes.dexterity) overweightWarnings.push("Imóvel")
  if (physicalPenalty >= attributes.physical + attributes.vitality) overweightWarnings.push("Desmaiado")
  const movementBeforeSize = Math.max(
    0,
    Math.ceil((attributes.physical + attributes.strength + attributes.dexterity + attributes.vitality) / 3) -
      movementPenalty,
  )
  const movementAfterSize = mt > 0
    ? movementBeforeSize * (mt === 1 ? 1.5 : mt)
    : mt < 0
      ? Math.max(1, movementBeforeSize + mt)
      : movementBeforeSize
  const movement = Math.ceil(Math.max(mt < 0 ? 1 : 0, movementAfterSize + finite(stats.movementBonus) + abilityModifiers.movement))
  const firstImpressions = Math.trunc(attributes.social + finite(stats.firstImpressionsBonus) + abilityModifiers.firstImpressions)
  const willTest = Math.max(0, willSkillTest + finite(stats.willModifier))
  const chanceTest = Math.max(0, chanceSkillTest + finite(stats.chanceModifier))
  const perceptionTest = Math.max(0, coreSkillTest(CORE_SKILL_IDS.perception, 2) + finite(stats.perceptionModifier))
  const knowledgeTest = Math.max(0, attributes.mental + attributes.knowledge)
  const focusMaximum = Math.max(0, 5 * willTest + finite(stats.focusModifier) + abilityModifiers.focus)

  return {
    pvMax,
    paMax,
    peMax,
    peTemporaryMax: Math.max(0, peMax + abilityModifiers.peTemporary),
    paExtraMax: Math.max(0, Math.ceil(paMax / 2) + finite(stats.paExtraBonus) + abilityModifiers.paExtra),
    determinationMax,
    casualtyMax,
    loadCapacity,
    overweightLevel,
    physicalPenalty,
    movementPenalty,
    overweightWarnings,
    willTest,
    chanceTest,
    perceptionTest,
    knowledgeTest,
    movement,
    firstImpressions,
    focusMaximum,
    restMinutes: Math.max(0, 30 - knowledgeTest),
  }
}
