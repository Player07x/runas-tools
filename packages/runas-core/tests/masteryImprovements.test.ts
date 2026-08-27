import { describe, expect, it } from "vitest"
import {
  calculateSpentMasteryImprovementPoints,
  clampMasteryImprovementQuantity,
  createEmptyMasteryImprovements,
} from "../src/lib/masteryImprovements"

describe("mastery improvements", () => {
  it("calcula os pontos gastos pelas quantidades compradas", () => {
    expect(calculateSpentMasteryImprovementPoints({
      ...createEmptyMasteryImprovements(),
      life: 2,
      aura: 1,
    })).toBe(7)
  })

  it("limita novas compras aos pontos restantes", () => {
    const improvements = {
      ...createEmptyMasteryImprovements(),
      aura: 1,
    }

    expect(clampMasteryImprovementQuantity(improvements, "life", 9, 7)).toBe(2)
    expect(clampMasteryImprovementQuantity(improvements, "energy", 1, 7)).toBe(1)
    expect(clampMasteryImprovementQuantity(improvements, "determination", 2, 7)).toBe(1)
  })

  it("permite reduzir uma ficha importada que já excede o limite", () => {
    const improvements = {
      ...createEmptyMasteryImprovements(),
      energy: 3,
    }

    expect(clampMasteryImprovementQuantity(improvements, "energy", 2, 4)).toBe(2)
    expect(clampMasteryImprovementQuantity(improvements, "energy", 4, 4)).toBe(1)
  })
})
