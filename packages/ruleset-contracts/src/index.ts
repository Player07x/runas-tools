export const RULESET_IDS = ["runas-blue", "cronos"] as const

export type RulesetId = (typeof RULESET_IDS)[number]

export interface RulesetCharacterEnvelope<TCharacter> {
  rulesetId: RulesetId
  schemaVersion: number
  character: TCharacter
}

export interface RulesetDefinition {
  id: RulesetId
  name: string
  shortName: string
  description: string
}

export function isRulesetId(value: unknown): value is RulesetId {
  return typeof value === "string" && RULESET_IDS.includes(value as RulesetId)
}
