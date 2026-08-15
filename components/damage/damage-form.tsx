"use client"

import type { AttributeKey } from "@/types/character"
import type { DamageConfig } from "@/types/damage"
import { damageTypes, getDamageType } from "@/data/damageTypes"
import { SectionCard } from "@/components/ui/section-card"
import { NumberInput } from "@/components/ui/number-input"
import { SelectField } from "@/components/ui/select-field"
import { TextField } from "@/components/ui/text-field"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import { attributeSelectOptions } from "@/lib/attributeOptions"
import { convertDamageBonusesToDice } from "@/lib/damageCalculator"

interface Props {
  config: DamageConfig
  attributeValue: number
  onUpdate: <K extends keyof DamageConfig>(key: K, value: DamageConfig[K]) => void
  onMtToggle: (enabled: boolean) => void
}

const damageTypeOptions = damageTypes.map((d) => ({ value: d.id, label: d.name }))

export function DamageForm({ config, attributeValue, onUpdate, onMtToggle }: Props) {
  const category = getDamageType(config.damageTypeId)?.category
  const usesRdf = category === "physical"
  const usesRdm = category === "magical"
  const isSpecial = category === "special"
  const bonusConversion = convertDamageBonusesToDice(config.numDice, [attributeValue, config.otherModifier])
  const convertedNotation = `${bonusConversion.numDice}D${
    bonusConversion.modifier > 0
      ? `+${bonusConversion.modifier}`
      : bonusConversion.modifier < 0
        ? bonusConversion.modifier
        : ""
  }`

  return (
    <SectionCard title="Configuração do dano" description="Ajuste os campos ou use a entrada rápida acima.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberInput
          label="Dados de Dano"
          value={config.numDice}
          onChange={(v) => onUpdate("numDice", v)}
          min={0}
        />
        <SelectField
          label="Tipo de Dano"
          value={config.damageTypeId}
          onChange={(v) => onUpdate("damageTypeId", v)}
          options={damageTypeOptions}
        />
        <div className="flex flex-col gap-1.5">
          <SelectField
            label="Atributo(s)"
            value={config.attributeKey}
            onChange={(v) => onUpdate("attributeKey", v as AttributeKey | "none")}
            options={attributeSelectOptions}
          />
          {config.attributeKey !== "none" && (
            <span className="text-[0.7rem] text-muted-foreground">
              Valor da ficha: <span className="font-medium text-foreground">{attributeValue}</span>
            </span>
          )}
        </div>
        <NumberInput
          label="Outro Modificador (opcional)"
          value={config.otherModifier}
          onChange={(v) => onUpdate("otherModifier", v)}
        />
      </div>
      {bonusConversion.convertedDice > 0 && (
        <p className="mt-2 text-xs font-medium text-primary">
          Conversão automática: +{bonusConversion.convertedDice}D de bônus → {convertedNotation} ao rolar.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/45 p-4">
          <SegmentedToggle
            label="Aplicar MT?"
            value={config.mtEnabled ? "yes" : "no"}
            onChange={(v) => onMtToggle(v === "yes")}
            options={[
              { value: "no", label: "Não" },
              { value: "yes", label: "Sim" },
            ]}
          />
          {config.mtEnabled && (
            <div>
              <NumberInput label="Bônus de MT" value={config.mtValue} onChange={(v) => onUpdate("mtValue", v)} />
              <p className="mt-1.5 text-[0.7rem] text-muted-foreground">MT +1 aplica multiplicador de 1,5x.</p>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-muted/45 p-4">
          <TextField
            label="Outro Multiplicador (opcional)"
            value={config.otherMultiplier}
            onChange={(v) => onUpdate("otherMultiplier", v)}
            placeholder="1x, 1.5, 1/2, 1/4"
          />
          <p className="mt-1.5 text-[0.7rem] text-muted-foreground">Aceita frações como 1/2 e 1/4.</p>
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium text-muted-foreground">Redução de Dano do alvo (opcional)</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <NumberInput label="RDF (físico)" value={config.rdf} onChange={(v) => onUpdate("rdf", v)} min={0} />
            {usesRdf && <span className="text-[0.7rem] text-primary">Aplicada a este dano</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <NumberInput label="RDM (mágico)" value={config.rdm} onChange={(v) => onUpdate("rdm", v)} min={0} />
            {usesRdm && <span className="text-[0.7rem] text-primary">Aplicada a este dano</span>}
          </div>
        </div>
        {isSpecial && (
          <p className="mt-2 text-xs font-medium text-primary">Dano especial ignora RDF e RDM.</p>
        )}
      </div>
    </SectionCard>
  )
}
