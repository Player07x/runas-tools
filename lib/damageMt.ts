export function getMtDamageMultiplier(value: number): number {
  const mt = Math.trunc(Number.isFinite(value) ? value : 0)
  if (mt === 0) return 1
  if (mt === 1) return 1.5
  if (mt === -1) return 0.75
  if (mt < 0) return 1 / Math.abs(mt)
  return mt
}
