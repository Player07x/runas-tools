import { describe, expect, it } from "vitest"
import { calculateDamage, calculateDamageSequence, convertDamageBonusesToDice } from "../src/lib/damageCalculator"
import { parseDamageExpression, parseDamageExpressions } from "../src/lib/damageParser"

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

describe("dano adicional", () => {
  it("usa a menor defesa para danos físicos/mágicos de Cronos", () => {
    const result = calculateDamage({
      config: { numDice: 0, damageTypeId: "natureza", attributeKey: "none", otherModifier: 20, mtEnabled: false, mtValue: 0, otherMultiplier: "1", rdf: 9, rdm: 4 },
      diceRolls: [],
      attributeValue: 0,
    })
    expect(result.total).toBe(16)
    expect(result.breakdown).toContainEqual({ label: "RDF/RDM (menor)", operator: "-", value: 4 })
  })

  it("interpreta danos consecutivos com separadores opcionais e atributos independentes", () => {
    const parsed = parseDamageExpressions("2D cortante (+força), 3D congelante adicional e 1D espectral (+sorte) adicional")
    expect(parsed.map(({ numDice, damageTypeId, attributeKey, additional }) => ({ numDice, damageTypeId, attributeKey, additional }))).toEqual([
      { numDice: 2, damageTypeId: "cortante", attributeKey: "strength", additional: false },
      { numDice: 3, damageTypeId: "congelante", attributeKey: null, additional: true },
      { numDice: 1, damageTypeId: "espectral", attributeKey: "luck", additional: true },
    ])
  })

  it("consome RDF e RDM como reservatórios totais na ordem dos danos", () => {
    const configs = [
      ["cortante", [5]], ["queimadura", [8]], ["perfurante", [8]], ["congelante", [10]],
    ].map(([damageTypeId, diceRolls]) => ({
      config: { numDice: 1, damageTypeId: damageTypeId as string, attributeKey: "none" as const, otherModifier: 0, mtEnabled: false, mtValue: 0, otherMultiplier: "1", rdf: 0, rdm: 0 },
      diceRolls: diceRolls as number[], attributeValue: 0,
    }))
    const result = calculateDamageSequence(configs, 10, 6)
    expect(result.results.map((item) => item.total)).toEqual([0, 2, 3, 10])
    expect(result.remainingRdf).toBe(0)
    expect(result.remainingRdm).toBe(0)
  })
})
