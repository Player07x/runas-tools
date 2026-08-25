export interface QuickModifier {
  additive: number
  multiplier: number
}

/**
 * Lê o modificador compacto usado nas ações rápidas do Runas DM.
 * Inteiros somam/subtraem. Valores iniciados por x multiplicam o resultado;
 * portanto x0,5 equivale a dividir por dois.
 */
export function parseQuickModifier(raw: string): QuickModifier {
  const value = raw.trim().toLowerCase().replace(",", ".")
  if (!value) return { additive: 0, multiplier: 1 }

  if (value.startsWith("x")) {
    const multiplier = Number.parseFloat(value.slice(1))
    return {
      additive: 0,
      multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
    }
  }

  const additive = Number(value)
  return {
    additive: Number.isSafeInteger(additive) ? additive : 0,
    multiplier: 1,
  }
}

export function applyQuickModifier(total: number, raw: string): number {
  const modifier = parseQuickModifier(raw)
  return Math.round((total + modifier.additive) * modifier.multiplier)
}
