"use client"

import { BarChart3, Backpack, Dices, FlaskConical, ListChecks, Swords } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { ToolCard } from "@/components/home/tool-card"
import { FichaToolCard } from "@/components/home/ficha-tool-card"

export default function HomePage() {
  return (
    <PageContainer>
      <section className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Dices className="size-3.5" />
          Runas: Livro Azul
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          Calculadora de Runas
        </h1>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
          Uma coleção de ferramentas para facilitar partidas de Runas: Livro Azul.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FichaToolCard />
        <ToolCard
          title="Calculadora de Dano"
          description="Role dados e calcule automaticamente modificadores, atributos e reduções de dano."
          icon={Swords}
          accent="blue"
          href="/calculadora-dano"
          actionLabel="Abrir calculadora"
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground">Em desenvolvimento</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ToolCard
            title="Calculadora de Estatísticas"
            description="Derive automaticamente os status do personagem."
            icon={BarChart3}
            comingSoon
          />
          <ToolCard
            title="Calculadora de Inventário"
            description="Controle carga, itens e capacidade."
            icon={Backpack}
            comingSoon
          />
          <ToolCard
            title="Calculadora de Testes"
            description="Resolva testes de atributos e perícias."
            icon={ListChecks}
            comingSoon
          />
          <ToolCard
            title="Calculadora de Criação de Itens"
            description="Monte itens e equipamentos personalizados."
            icon={FlaskConical}
            comingSoon
          />
        </div>
      </div>
    </PageContainer>
  )
}
