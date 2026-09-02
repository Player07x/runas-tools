"use client"

import { Construction, Eclipse } from "lucide-react"
import { useRuleset } from "./ruleset-provider"

interface Props {
  children: React.ReactNode
  unavailableFor?: "cronos"
}

export function RulesetScreen({ children, unavailableFor }: Props) {
  const { activeRulesetId, activeRuleset } = useRuleset()
  if (unavailableFor !== activeRulesetId) return children
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border bg-card px-6 py-14 text-center shadow-sm sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_45%)]" />
      <span className="relative mx-auto grid size-16 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary"><Eclipse className="size-8" /></span>
      <h2 className="relative mt-5 text-2xl font-bold text-card-foreground">Opa amigo! Acho que está perdido.</h2>
      <p className="relative mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Esta tela ainda não foi implementada no {activeRuleset.name}. Mais atualizações em breve =)
      </p>
      <span className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Construction className="size-3.5" /> Módulo em construção</span>
    </section>
  )
}
