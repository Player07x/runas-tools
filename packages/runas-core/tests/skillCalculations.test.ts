import { describe, expect, it } from "vitest"
import { applyDeterminationUsesToRoll } from "../src/lib/skillCalculations"
import type { SkillRoll } from "../src/types/skillTest"

function roll(skillName: string): SkillRoll {
  return {
    id: "reroll", createdAt: 0, diceRolls: [6, 6], diceSum: 12, baseTest: 10,
    skillName, attributeKey: "faith", skillModifier: 0, masterModifier: 0,
    otherModifiers: 0, specialModifier: 0, totalModifiers: 0, totalTest: 10,
    margin: -2, outcome: "failure", specialDieId: "none", determinationUses: 0,
  }
}

describe("Determinação em novas rolagens de Casualidade", () => {
  it("reaplica todos os usos anteriores e preserva o bônus especial de Vontade", () => {
    const result = applyDeterminationUsesToRoll(roll("Vontade"), 2)
    expect(result.totalTest).toBe(16)
    expect(result.margin).toBe(4)
    expect(result.outcome).toBe("success")
    expect(result.determinationUses).toBe(2)
  })

  it("usa +1 por uso nas demais perícias", () => {
    expect(applyDeterminationUsesToRoll(roll("Reflexo"), 2).totalTest).toBe(12)
  })
})
