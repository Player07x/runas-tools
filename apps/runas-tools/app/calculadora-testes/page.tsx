import { Suspense } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { RulesetSkillTestCalculator } from "@/components/rulesets/ruleset-skill-test-calculator"

export default function SkillTestPage() {
  return (
    <PageContainer
      title="Calculadora de Testes"
      description="Resolva testes de atributos e perícias, aplique dados especiais e acompanhe o histórico das rolagens."
    >
      <Suspense fallback={<div className="h-72 animate-pulse rounded-[24px] border border-border bg-card" />}>
        <RulesetSkillTestCalculator />
      </Suspense>
    </PageContainer>
  )
}
