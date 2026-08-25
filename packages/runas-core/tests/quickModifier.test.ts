import { describe, expect, it } from "vitest"
import { applyQuickModifier, parseQuickModifier } from "../src/lib/quickModifier"

describe("modificador rápido", () => {
  it("soma e subtrai inteiros", () => {
    expect(applyQuickModifier(12, "+3")).toBe(15)
    expect(applyQuickModifier(12, "-2")).toBe(10)
  })

  it("multiplica por decimais iniciados com x", () => {
    expect(applyQuickModifier(12, "x2")).toBe(24)
    expect(applyQuickModifier(12, "x0,5")).toBe(6)
  })

  it("ignora entradas ambíguas", () => {
    expect(parseQuickModifier("1.5")).toEqual({ additive: 0, multiplier: 1 })
    expect(applyQuickModifier(12, "texto")).toBe(12)
  })
})
