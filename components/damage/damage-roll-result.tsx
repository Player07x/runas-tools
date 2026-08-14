"use client"

import { Dices } from "lucide-react"
import type { DamageResult } from "@/types/damage"

interface Props {
  result: DamageResult | null
}

/** Formata número removendo casas decimais desnecessárias. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "")
}

export function DamageRollResult({ result }: Props) {
  if (!result) {
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

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-panel-border/60 bg-panel p-5 text-white shadow-[0_16px_44px_rgba(28,34,52,0.16)] sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-panel-muted">Dano causado</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums text-highlight">{result.total}</span>
          <span className="text-lg font-medium text-panel-muted">{result.damageTypeName}</span>
        </p>
      </div>

      <div className="rounded-xl border border-panel-border/50 bg-panel-input/75 p-4">
        <p className="text-xs font-semibold text-panel-muted">Dados rolados</p>
        <p className="mt-1 text-sm text-white">
          {result.diceRolls.length > 0 ? (
            <>
              <span className="text-panel-muted">{result.diceRolls.join(" + ")}</span>
              {result.diceRolls.length > 1 && (
                <span className="ml-2 font-semibold">= {result.diceSum}</span>
              )}
            </>
          ) : (
            "—"
          )}
        </p>
      </div>

      <div className="rounded-xl border border-panel-border/50 bg-panel-input/75 p-4">
        <p className="mb-3 text-xs font-semibold text-panel-muted">Como o valor foi calculado</p>
        <ul className="flex flex-col gap-1 font-mono text-sm">
          {result.breakdown.map((item, i) => (
            <li key={i} className="flex items-center justify-between tabular-nums">
              <span className="text-panel-muted">
                <span className="inline-block w-4 text-white">{item.operator}</span> {item.label}
              </span>
              <span className="font-semibold text-white">{fmt(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
