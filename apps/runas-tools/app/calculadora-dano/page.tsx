import { Suspense } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { DamageCalculator } from "@/components/damage/damage-calculator"
import { RulesetScreen } from "@/components/rulesets/incomplete-ruleset-screen"

export default function DamagePage() {
  return (
    <PageContainer
      title="Calculadora de Dano"
      description="Monte o dano, aplique modificadores e reduções, e role os dados."
    >
      <RulesetScreen unavailableFor="cronos">
        <Suspense fallback={<div className="h-72 animate-pulse rounded-[24px] border border-border bg-card" />}>
          <DamageCalculator />
        </Suspense>
      </RulesetScreen>
    </PageContainer>
  )
}
