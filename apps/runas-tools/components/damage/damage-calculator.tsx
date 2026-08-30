"use client"

import { lazy, Suspense, useState } from "react"
import { ChevronDown, ChevronUp, Dices, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuickDamageInput } from "@/components/damage/quick-damage-input"
import { DamageForm } from "@/components/damage/damage-form"
import { DamageRollResult } from "@/components/damage/damage-roll-result"
import { useDamageCalculator } from "@/components/damage/use-damage-calculator"
import { useCharacter } from "@/components/character/character-provider"

const DamageApplicationPanel = lazy(() =>
  import("@/components/damage/damage-application-panel").then((module) => ({ default: module.DamageApplicationPanel })),
)

export function DamageCalculator() {
  const { config, configs, result, results, update, updateAt, setMtEnabled, setMtEnabledAt, applyParsed, roll, attributeValue, requestedDamage } = useDamageCalculator()
  const { isReady, character } = useCharacter()
  const [applicationOpen, setApplicationOpen] = useState(false)
  const [applicationLoaded, setApplicationLoaded] = useState(false)

  function toggleApplication() {
    setApplicationLoaded(true)
    setApplicationOpen((current) => !current)
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <QuickDamageInput onParsed={applyParsed} initialText={requestedDamage} />
          <DamageForm
            config={config}
            attributeValue={attributeValue}
            onUpdate={update}
            onMtToggle={setMtEnabled}
            description={configs.length > 1 ? "Dano principal. RDF e RDM abaixo são compartilhadas e consumidas na ordem." : undefined}
          />
          {configs.slice(1).map((additionalConfig, additionalIndex) => {
            const configIndex = additionalIndex + 1
            const additionalAttributeValue = additionalConfig.attributeKey === "none"
              ? 0
              : character.attributes[additionalConfig.attributeKey] ?? 0
            return <DamageForm
              key={configIndex}
              config={additionalConfig}
              attributeValue={additionalAttributeValue}
              onUpdate={(key, value) => updateAt(configIndex, key, value)}
              onMtToggle={(enabled) => setMtEnabledAt(configIndex, enabled)}
              title={`Dano adicional ${configIndex}`}
              description="Este componente é calculado separadamente; a redução restante vem do dano principal."
              showReduction={false}
            />
          })}
          <Button size="lg" className="w-full shadow-[0_12px_30px_color-mix(in_srgb,var(--primary)_25%,transparent)]" onClick={roll}>
            <Dices />
            Rolar dano
          </Button>
        </div>

        <div className="lg:sticky lg:top-24">
          <DamageRollResult results={results} />
        </div>
      </div>
      <div className="mt-6">
        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={toggleApplication} aria-expanded={applicationOpen} disabled={!isReady}>
          <ShieldAlert />
          Aplicar Dano no Alvo
          {applicationOpen ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
        </Button>
        {applicationLoaded && (
          <div className={applicationOpen ? "mt-4" : "hidden"}>
            <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Carregando aplicação de dano…</div>}>
              <DamageApplicationPanel rolledResult={result} rolledResults={results} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
