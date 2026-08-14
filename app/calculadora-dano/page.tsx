import { PageContainer } from "@/components/layout/page-container"
import { DamageCalculator } from "@/components/damage/damage-calculator"

export default function DamagePage() {
  return (
    <PageContainer
      title="Calculadora de Dano"
      description="Monte o dano, aplique modificadores e reduções, e role os dados."
    >
      <DamageCalculator />
    </PageContainer>
  )
}
