"use client"

import { Dices } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuickDamageInput } from "@/components/damage/quick-damage-input"
import { DamageForm } from "@/components/damage/damage-form"
import { DamageRollResult } from "@/components/damage/damage-roll-result"
import { useDamageCalculator } from "@/components/damage/use-damage-calculator"

export function DamageCalculator() {
  const { config, result, update, setMtEnabled, applyParsed, roll, attributeValue } = useDamageCalculator()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,380px)]">
      <div className="flex flex-col gap-6">
        <QuickDamageInput onParsed={applyParsed} />
        <DamageForm config={config} attributeValue={attributeValue} onUpdate={update} onMtToggle={setMtEnabled} />
        <Button size="lg" className="w-full" onClick={roll}>
          <Dices />
          Rolar dano
        </Button>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <DamageRollResult result={result} />
      </div>
    </div>
  )
}
