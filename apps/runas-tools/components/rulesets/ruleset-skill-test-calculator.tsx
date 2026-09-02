"use client"

import { SkillTestCalculator } from "@/components/skill-test/skill-test-calculator"
import { CronosSkillTestCalculator } from "@/components/cronos/cronos-skill-test-calculator"
import { useRuleset } from "./ruleset-provider"

export function RulesetSkillTestCalculator() {
  const { activeRulesetId } = useRuleset()
  return activeRulesetId === "cronos" ? <CronosSkillTestCalculator /> : <SkillTestCalculator />
}
