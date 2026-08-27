import { describe, expect, it } from "vitest"
import { simulateDamageApplication, type DamageApplicationConfig } from "../src/lib/damageApplication"

function config(
  damageTypeId: string,
  resistances: string[] = [],
  weaknesses: string[] = [],
): DamageApplicationConfig {
  return {
    damage: { amount: 10, damageTypeId },
    mtEnabled: false,
    mtValue: 0,
    rdf: 0,
    rdm: 0,
    layers: [{
      resource: "pv",
      current: 100,
      maximum: 100,
      resistances,
      weaknesses,
      multiplier: "1",
    }],
  }
}

describe("damage category resistances and weaknesses", () => {
  it("aplica Todos os Danos Físicos aos tipos físicos", () => {
    const simulation = simulateDamageApplication(config("cortante", ["Todos os Danos Físicos"]))
    expect(simulation.error).toBeNull()
    expect(simulation.value?.changes).toEqual([{ resource: "pv", amount: -5 }])
  })

  it("aplica Todos os Danos Mágicos aos tipos mágicos", () => {
    const simulation = simulateDamageApplication(config("queimadura", [], ["Todos os Danos Mágicos"]))
    expect(simulation.error).toBeNull()
    expect(simulation.value?.changes).toEqual([{ resource: "pv", amount: -20 }])
  })

  it.each(["contundente", "congelante", "impacto"])("aplica Todos os Danos à categoria de %s", (damageTypeId) => {
    const simulation = simulateDamageApplication(config(damageTypeId, ["Todos os Danos"]))
    expect(simulation.error).toBeNull()
    expect(simulation.value?.changes).toEqual([{ resource: "pv", amount: -5 }])
  })

  it("mantém compatibilidade com os nomes históricos das categorias", () => {
    expect(simulateDamageApplication(config("perfurante", ["Todos os Físicos"])).value?.changes).toEqual([{ resource: "pv", amount: -5 }])
    expect(simulateDamageApplication(config("eletrico", ["Todos os Mágicos"])).value?.changes).toEqual([{ resource: "pv", amount: -5 }])
  })

  it("aplica Todos os Danos a efeitos especiais diretos", () => {
    const simulation = simulateDamageApplication(config("psiquica", ["Todos os Danos"]))
    expect(simulation.error).toBeNull()
    expect(simulation.value?.notices[0]).toContain("Insanidade 5")
  })
})
