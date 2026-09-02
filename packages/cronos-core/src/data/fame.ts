import type { CronosFameLevel, CronosFameScope } from "../types/character"

export const cronosFameScopes: { value: CronosFameScope; label: string }[] = [
  { value: "local", label: "Local" },
  { value: "municipal", label: "Municipal" },
  { value: "state", label: "Estadual" },
  { value: "federal", label: "Federal" },
  { value: "continental", label: "Continental" },
  { value: "global", label: "Global" },
]

export const cronosFameThresholds: Record<CronosFameScope, Partial<Record<CronosFameLevel, number>>> = {
  local: { Esquecido: Number.NEGATIVE_INFINITY, Desconhecido: 1, Conhecido: 50, Adorado: 200, Venerado: 600 },
  municipal: { Desconhecido: 1_000, Conhecido: 5_000, Adorado: 20_000, Venerado: 60_000 },
  state: { Desconhecido: 100_000, Conhecido: 500_000, Adorado: 2_000_000, Venerado: 6_000_000 },
  federal: { Desconhecido: 10_000_000, Conhecido: 50_000_000, Adorado: 100_000_000, Venerado: 200_000_000 },
  continental: { Desconhecido: 300_000_000, Conhecido: 400_000_000, Adorado: 500_000_000, Venerado: 600_000_000 },
  global: { Desconhecido: 1_000_000_000, Conhecido: 2_000_000_000, Adorado: 4_000_000_000, Venerado: 8_000_000_000 },
}

export const cronosFameScopeMinimums: { scope: CronosFameScope; minimum: number }[] = [
  { scope: "global", minimum: 1_000_000_000 },
  { scope: "continental", minimum: 300_000_000 },
  { scope: "federal", minimum: 10_000_000 },
  { scope: "state", minimum: 100_000 },
  { scope: "municipal", minimum: 1_000 },
  { scope: "local", minimum: Number.NEGATIVE_INFINITY },
]
