export type ElementKind = "Especial" | "Básico" | "Raro" | "Divino" | "Fusão"

export interface CharacterElement {
  id: string
  name: string
  kind: ElementKind
  fusion?: string
  color: string
  resistances: string[]
  weaknesses: string[]
  appliedDamages: string[]
}

/**
 * Elementos da ficha e suas relações de dano.
 * Os nomes de dano são mantidos sem a sigla de categoria para que possam ser
 * reutilizados diretamente nos campos de tags e nas calculadoras.
 */
export const characterElements: CharacterElement[] = [
  {
    id: "arcano",
    name: "Arcano",
    kind: "Especial",
    color: "#4777c8",
    resistances: [],
    weaknesses: [],
    appliedDamages: ["Energia"],
  },
  {
    id: "fogo",
    name: "Fogo",
    kind: "Básico",
    color: "#b94f4f",
    resistances: ["Queimadura", "Elétrico", "Corrosivo"],
    weaknesses: ["Todos os Físicos", "Congelante"],
    appliedDamages: ["Queimadura"],
  },
  {
    id: "terra",
    name: "Terra",
    kind: "Básico",
    color: "#c98256",
    resistances: ["Todos os Mágicos", "Cortante", "Impacto"],
    weaknesses: ["Perfurante"],
    appliedDamages: ["Perfurante", "Contundente", "Cortante"],
  },
  {
    id: "agua",
    name: "Água",
    kind: "Básico",
    color: "#5f8ec9",
    resistances: ["Contundente", "Impacto", "Congelante", "Queimadura"],
    weaknesses: ["Cortante", "Perfurante", "Elétrico"],
    appliedDamages: ["½ Impacto", "Congelante", "Queimadura"],
  },
  {
    id: "vento",
    name: "Vento",
    kind: "Básico",
    color: "#8eb8d8",
    resistances: ["Congelante", "Queimadura", "Corrosivo"],
    weaknesses: ["Todos os Físicos"],
    appliedDamages: ["Todos os Físicos", "½ Queimadura", "½ Congelante", "½ Impacto"],
  },
  {
    id: "luz",
    name: "Luz",
    kind: "Raro",
    color: "#e0c458",
    resistances: ["Radiação", "Queimadura", "Corrosivo"],
    weaknesses: ["Congelante"],
    appliedDamages: ["Queimadura", "Radiação"],
  },
  {
    id: "sombra",
    name: "Sombra",
    kind: "Raro",
    color: "#575063",
    resistances: ["Absorção", "Congelante", "Corrosivo"],
    weaknesses: ["Queimadura"],
    appliedDamages: ["Congelante", "Absorção"],
  },
  {
    id: "estelar",
    name: "Estelar",
    kind: "Divino",
    color: "#e2b92f",
    resistances: ["Estelar", "Radiação", "Necrótico", "Espectral", "Toxina", "Psíquica", "Virtual"],
    weaknesses: ["Temporal", "Cósmico", "Abissal", "Absorção"],
    appliedDamages: ["Estelar", "Radiação"],
  },
  {
    id: "abissal",
    name: "Abissal",
    kind: "Divino",
    color: "#7250a2",
    resistances: ["Abissal", "Absorção", "Necrótico", "Espectral", "Toxina", "Psíquica", "Virtual"],
    weaknesses: ["Temporal", "Cósmico", "Estelar", "Radiação"],
    appliedDamages: ["Abissal", "Absorção"],
  },
  {
    id: "vazio",
    name: "Vazio",
    kind: "Fusão",
    fusion: "Luz + Sombra (ou Estelar + Abissal)",
    color: "#20222a",
    resistances: [],
    weaknesses: [],
    appliedDamages: ["Cósmico"],
  },
  {
    id: "metal",
    name: "Metal",
    kind: "Fusão",
    fusion: "Fogo + Terra",
    color: "#7d797b",
    resistances: ["Cortante", "Congelante", "Queimadura", "Elétrico"],
    weaknesses: ["Perfurante", "Corrosivo"],
    appliedDamages: ["Cortante", "Perfurante", "Contundente"],
  },
  {
    id: "vapor",
    name: "Vapor",
    kind: "Fusão",
    fusion: "Fogo + Água",
    color: "#98b7d4",
    resistances: ["Queimadura", "Congelante"],
    weaknesses: ["Todos os Físicos"],
    appliedDamages: ["½ Queimadura", "½ Congelante"],
  },
  {
    id: "raio",
    name: "Raio",
    kind: "Fusão",
    fusion: "Fogo + Vento",
    color: "#dcb849",
    resistances: ["Elétrico", "Queimadura"],
    weaknesses: ["Congelante"],
    appliedDamages: ["Elétrico"],
  },
  {
    id: "planta",
    name: "Planta",
    kind: "Fusão",
    fusion: "Terra + Água",
    color: "#6ca84b",
    resistances: ["Contundente", "Elétrico", "Congelante"],
    weaknesses: ["Cortante", "Corrosivo", "Queimadura"],
    appliedDamages: ["Cortante", "Perfurante", "Contundente"],
  },
  {
    id: "areia",
    name: "Areia",
    kind: "Fusão",
    fusion: "Terra + Vento",
    color: "#d2ad73",
    resistances: ["Todos os Mágicos", "Contundente"],
    weaknesses: ["Perfurante"],
    appliedDamages: ["Impacto"],
  },
  {
    id: "gelo",
    name: "Gelo",
    kind: "Fusão",
    fusion: "Água + Vento",
    color: "#6f98d0",
    resistances: ["Congelante"],
    weaknesses: ["Todos os Físicos", "Queimadura"],
    appliedDamages: ["Cortante", "Perfurante", "Contundente", "Congelante"],
  },
  {
    id: "magma",
    name: "Magma",
    kind: "Fusão",
    fusion: "Fogo + Terra + Água",
    color: "#e7792e",
    resistances: ["¼ Queimadura"],
    weaknesses: ["Congelante"],
    appliedDamages: ["Queimadura"],
  },
  {
    id: "cristal",
    name: "Cristal",
    kind: "Fusão",
    fusion: "Fogo + Terra + Vento",
    color: "#bc7adb",
    resistances: ["Cortante", "Queimadura", "Congelante"],
    weaknesses: ["Perfurante", "Contundente", "Impacto", "Corrosivo"],
    appliedDamages: ["Perfurante", "Cortante", "Contundente", "Energia"],
  },
  {
    id: "plasma",
    name: "Plasma",
    kind: "Fusão",
    fusion: "Fogo + Água + Vento",
    color: "#d464ba",
    resistances: ["Queimadura", "Elétrico", "Energia", "Corrosivo"],
    weaknesses: ["Congelante"],
    appliedDamages: ["Energia", "Queimadura", "Elétrico"],
  },
  {
    id: "som",
    name: "Som",
    kind: "Fusão",
    fusion: "Terra + Água + Vento",
    color: "#62bebb",
    resistances: ["Congelante", "Queimadura", "Corrosivo"],
    weaknesses: ["Todos os Físicos"],
    appliedDamages: ["Impacto"],
  },
  {
    id: "eter",
    name: "Éter",
    kind: "Fusão",
    fusion: "Fogo + Terra + Água + Vento",
    color: "#df7b9f",
    resistances: ["Todos os Mágicos"],
    weaknesses: ["Todos os Físicos"],
    appliedDamages: ["Todos os Físicos", "Todos os Mágicos"],
  },
]

export const elementOptions = [
  { value: "none", label: "Nenhum" },
  ...characterElements.map((element) => ({
    value: element.id,
    label: element.kind === "Fusão" ? `${element.name} · Fusão` : element.name,
  })),
]

export function getCharacterElement(id: string): CharacterElement | undefined {
  return characterElements.find((element) => element.id === id)
}
