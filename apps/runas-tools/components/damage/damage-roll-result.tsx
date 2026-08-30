"use client"

import { Dices } from "lucide-react"
import type { DamageResult } from "@runas/core/types/damage"

interface Props {
  results: DamageResult[]
}

/** Formata número removendo casas decimais desnecessárias. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "")
}

export function DamageRollResult({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-panel-border/60 bg-panel px-7 py-12 text-center shadow-[0_16px_44px_rgba(28,34,52,0.16)]">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-panel-elevated text-white shadow-lg">
          <Dices className="size-7" />
        </span>
        <p className="mt-4 text-base font-bold text-white">Nenhum dano rolado ainda</p>
        <p className="mt-1.5 max-w-64 text-sm leading-relaxed text-panel-muted text-pretty">
          Configure os campos e toque em Rolar dano para ver o resultado.
        </p>
      </div>
    )
  }

  const total = results.reduce((sum, result) => sum + Math.max(0, result.total), 0)
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-panel-border/60 bg-panel p-5 text-white shadow-[0_16px_44px_rgba(28,34,52,0.16)] sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-panel-muted">Dano causado</p>
        <p className="mt-1 text-5xl font-bold tabular-nums text-highlight">{total}</p>
        <p className="mt-2 text-sm text-panel-muted">{results.map((result) => `${Math.max(0, result.total)} ${result.damageTypeName}`).join(" + ")}</p>
      </div>
      {results.map((result, resultIndex) => <div key={`${result.damageTypeId}-${resultIndex}`} className="rounded-xl border border-panel-border/50 bg-panel-input/75 p-4">
        <p className="text-sm font-bold text-white">{resultIndex === 0 ? "Dano principal" : `Dano adicional ${resultIndex}`} · {Math.max(0, result.total)} {result.damageTypeName}</p>
        <p className="mt-1 text-xs text-panel-muted">Dados: {result.diceRolls.length ? `${result.diceRolls.join(" + ")} = ${result.diceSum}` : "—"}</p>
        <ul className="mt-3 flex flex-col gap-1 font-mono text-xs">{result.breakdown.map((item, index) => <li key={index} className="flex items-center justify-between tabular-nums"><span className="text-panel-muted"><span className="inline-block w-4 text-white">{item.operator}</span> {item.label}</span><span className="font-semibold text-white">{fmt(item.value)}</span></li>)}</ul>
      </div>)}
    </div>
  )
}
