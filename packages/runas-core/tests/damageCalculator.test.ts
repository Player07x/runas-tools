import { describe, expect, it } from "vitest"
import { calculateDamage, convertDamageBonusesToDice } from "../src/lib/damageCalculator"
import { parseDamageExpression } from "../src/lib/damageParser"

describe("damage attribute bonuses", () => {
  it.each([
    ["3D cortante (+força)", "strength"],
    ["3D cortante (+poder)", "power"],
  ] as const)("inclui o atributo de %s na quantidade de dados", (expression, attributeKey) => {
    const parsed = parseDamageExpression(expression)
    expect(parsed.attributeKey).toBe(attributeKey)

    const attributeValue = 4
    const conversion = convertDamageBonusesToDice(parsed.numDice, [attributeValue, parsed.bonus])
    expect(conversion).toEqual({ numDice: 4, modifier: 0, convertedDice: 1 })

    const result = calculateDamage({
      config: {
        numDice: parsed.numDice,
        damageTypeId: parsed.damageTypeId ?? "cortante",
        attributeKey,
        otherModifier: parsed.bonus,
        mtEnabled: false,
        mtValue: 0,
        otherMultiplier: "1",
        rdf: 0,
        rdm: 0,
      },
      diceRolls: [1, 2, 3, 4],
      attributeValue,
    })

    expect(result.total).toBe(10)
    expect(result.breakdown[0]?.label).toBe("4 dados (1 de bônus)")
  })
})
