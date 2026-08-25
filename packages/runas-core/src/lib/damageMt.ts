export function getMtDamageMultiplier(value: number): number {
  const mt = Math.trunc(Number.isFinite(value) ? value : 0)
  if (mt === 0) return 1
  if (mt === 1) return 1.5
  if (mt === -1) return 0.75
  if (mt < 0) return 1 / Math.abs(mt)
  return mt
}

/**
 * Converte o MT do alvo em multiplicador de dano recebido.
 * Um alvo maior reduz o dano; um alvo menor aumenta o dano.
 */
export function getTargetMtDamageMultiplier(value: number): number {
  return getMtDamageMultiplier(-value)
}
