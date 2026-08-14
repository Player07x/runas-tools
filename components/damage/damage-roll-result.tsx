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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Dices className="size-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-foreground">Nenhum dano rolado ainda</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">
          Configure os campos e toque em Rolar dano para ver o resultado.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Dano causado</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums text-foreground">{result.total}</span>
          <span className="text-lg font-medium text-muted-foreground">{result.damageTypeName}</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-medium text-muted-foreground">Dados rolados</p>
        <p className="mt-1 text-sm text-foreground">
          {result.diceRolls.length > 0 ? (
            <>
              <span className="text-muted-foreground">{result.diceRolls.join(" + ")}</span>
              {result.diceRolls.length > 1 && (
                <span className="ml-2 font-semibold">= {result.diceSum}</span>
              )}
            </>
          ) : (
            "—"
          )}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Como o valor foi calculado</p>
        <ul className="flex flex-col gap-1 font-mono text-sm">
          {result.breakdown.map((item, i) => (
            <li key={i} className="flex items-center justify-between tabular-nums">
              <span className="text-muted-foreground">
                <span className="inline-block w-4 text-foreground">{item.operator}</span> {item.label}
              </span>
              <span className="font-medium text-foreground">{fmt(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
