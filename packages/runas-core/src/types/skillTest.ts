import type { SecondaryAttributeKey } from "./character"

export type SpecialDieId =
  | "none"
  | "luck"
  | "inspiration"
  | "legendary-inspiration"
  | "jera-distrust"
  | "divine-advantage"
  | "divine-disadvantage"
  | "joke"

export type SkillRollOutcome = "success" | "failure" | "critical-success" | "critical-failure"

export interface SkillTestConfig {
  attributeKey: SecondaryAttributeKey | ""
  skillName: string
  skillModifier: number
  masterModifier: number
  otherModifiers: number
  specialDieId: SpecialDieId
}

export interface ParsedSkillExpression {
  attributeKey: SecondaryAttributeKey | ""
  skillName: string
  skillModifier: number
  masterModifier: number
  specialDieId: SpecialDieId
  source: "attribute" | "character-skill" | "system-skill" | "exclusive-skill" | "empty"
}

export interface SkillRoll {
  id: string
  createdAt: number
  diceRolls: [number, number]
  diceSum: number
  baseTest: number
  skillName: string
  attributeKey: SecondaryAttributeKey
  skillModifier: number
  masterModifier: number
  otherModifiers: number
  specialModifier: number
  totalModifiers: number
  totalTest: number
  margin: number
  outcome: SkillRollOutcome
  specialDieId: SpecialDieId
  determinationUses: number
}
