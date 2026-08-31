import type { Metadata } from "next"
import { RunicCardsWorkspace } from "@/components/runic-cards/runic-cards-workspace"
import { PageContainer } from "@/components/layout/page-container"

export const metadata: Metadata = {
  title: "Cartas Rúnicas · Runas Tools",
  description: "Crie, recorte, importe e exporte cartas para ORDEM × CAOS: RÚNICA.",
}

export default function RunicCardsPage() {
  return (
    <PageContainer
      title="Cartas Rúnicas"
      description="Crie cartas de Aventureiro, Tropa, Magia ou Equipamento para ORDEM × CAOS: RÚNICA. Tudo funciona localmente e a arte permanece dentro do arquivo exportado."
      className="max-w-[92rem]"
    >
      <RunicCardsWorkspace />
    </PageContainer>
  )
}
