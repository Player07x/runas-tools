"use client"

import { ChevronDown, RefreshCcw, RotateCcw, Shield, Sparkles } from "lucide-react"
import type {
  AttributeKey,
  CharacterAttributes,
  CharacterInfo,
  CharacterStats as CharacterStatsType,
} from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { damageTypes } from "@/data/damageTypes"
import { elementOptions, getCharacterElement } from "@/data/elements"
import { calculateCharacterStatSnapshot } from "@/lib/characterStatCalculations"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { TokenInput } from "@/components/ui/token-input"

interface Props {
  attributes: CharacterAttributes
  info: CharacterInfo
  stats: CharacterStatsType
  onAttributeChange: (key: AttributeKey, value: number) => void
  onStatsChange: (updates: Partial<CharacterStatsType>) => void
}

const groupStyles = {
  physical: {
    label: "text-[#a34e4e] dark:text-[#ef9696]",
    track: "bg-[#f4dada] dark:bg-[#8b4148]",
    bubble: "bg-[#e5a6a6] dark:bg-[#d77c83]",
  },
  mental: {
    label: "text-[#93447d] dark:text-[#eca9ea]",
    track: "bg-[#f2d8ed] dark:bg-[#83416f]",
    bubble: "bg-[#dda9d8] dark:bg-[#cc82bd]",
  },
  mystic: {
    label: "text-[#397d4d] dark:text-[#a8d1a1]",
    track: "bg-[#d9eedc] dark:bg-[#397b50]",
    bubble: "bg-[#a8d1a1] dark:bg-[#8bc494]",
  },
} as const

const damageSuggestions = [
  ...damageTypes.map((damage) => damage.name),
  "Todos os Físicos",
  "Todos os Mágicos",
]

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function NumericInput({
  value,
  onChange,
  label,
  min,
  max,
  readOnly,
  className,
}: {
  value: number
  onChange?: (value: number) => void
  label: string
  min?: number
  max?: number
  readOnly?: boolean
  className?: string
}) {
  return (
    <input
      aria-label={label}
      type="number"
      inputMode="numeric"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      readOnly={readOnly || !onChange}
      onChange={onChange ? (event) => onChange(toNumber(event.target.value)) : undefined}
      className={cn(
        "min-w-0 bg-transparent text-center text-base tabular-nums text-foreground outline-none read-only:cursor-default",
        className,
      )}
    />
  )
}

function VitalCard({
  label,
  current,
  maximum,
  bonus,
  onCurrentChange,
  onBonusChange,
  accent,
}: {
  label: string
  current: number
  maximum: number
  bonus: number
  onCurrentChange: (value: number) => void
  onBonusChange: (value: number) => void
  accent: string
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-muted/35 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <h3 className="font-bold" style={{ color: accent }}>{label} Atual</h3>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">recurso</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-card/70">
        <label className="flex min-w-0 flex-col items-center gap-1 px-1.5 py-3">
          <span className="text-[0.68rem] font-medium text-muted-foreground">Atual</span>
          <NumericInput label={`${label} atual`} value={current} onChange={onCurrentChange} min={label === "PV" ? undefined : 0} className="w-full text-2xl font-bold" />
        </label>
        <label className="flex min-w-0 flex-col items-center gap-1 bg-muted/30 px-1.5 py-3">
          <span className="text-[0.68rem] font-medium text-muted-foreground">Máximo</span>
          <NumericInput label={`${label} máximo`} value={maximum} readOnly className="w-full text-xl font-semibold text-muted-foreground" />
        </label>
        <label className="flex min-w-0 flex-col items-center gap-1 px-1.5 py-3">
          <span className="text-[0.68rem] font-medium text-muted-foreground">Bônus</span>
          <NumericInput label={`${label} bônus`} value={bonus} onChange={onBonusChange} className="w-full text-xl" />
        </label>
      </div>
    </article>
  )
}

function ResourceRow({
  label,
  current,
  maximum,
  bonus,
  onCurrentChange,
  onBonusChange,
  color,
}: {
  label: string
  current: number
  maximum: number
  bonus: number
  onCurrentChange: (value: number) => void
  onBonusChange: (value: number) => void
  color: string
}) {
  return (
    <div className="grid grid-cols-[minmax(5.5rem,1fr)_repeat(3,minmax(3rem,0.65fr))] items-stretch overflow-hidden rounded-[18px] border border-border bg-background/60 sm:grid-cols-[minmax(7.5rem,1fr)_repeat(3,minmax(3.75rem,0.65fr))]">
      <span className="flex items-center px-3 text-sm font-bold" style={{ color }}>{label}</span>
      <label className="flex min-w-0 flex-col items-center justify-center border-l border-border px-1 py-2">
        <span className="text-[0.62rem] text-muted-foreground">Atual</span>
        <NumericInput label={`${label} atual`} value={current} onChange={onCurrentChange} min={0} className="w-full font-semibold" />
      </label>
      <label className="flex min-w-0 flex-col items-center justify-center border-l border-border bg-muted/35 px-1 py-2">
        <span className="text-[0.62rem] text-muted-foreground">Máximo</span>
        <NumericInput label={`${label} máximo`} value={maximum} readOnly className="w-full text-muted-foreground" />
      </label>
      <label className="flex min-w-0 flex-col items-center justify-center border-l border-border px-1 py-2">
        <span className="text-[0.62rem] text-muted-foreground">Bônus</span>
        <NumericInput label={`${label} bônus`} value={bonus} onChange={onBonusChange} className="w-full" />
      </label>
    </div>
  )
}

function TestRow({
  label,
  result,
  bonus,
  onBonusChange,
  suffix,
}: {
  label: string
  result: number
  bonus: number
  onBonusChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="grid grid-cols-[minmax(5.5rem,1fr)_4rem_4rem] items-center gap-1.5 sm:grid-cols-[minmax(6.5rem,1fr)_5rem_5rem]">
      <span className="truncate text-right text-sm text-muted-foreground">{label}</span>
      <output aria-label={`${label}: ${result}${suffix ?? ""}`} className="flex h-10 items-center justify-center rounded-xl bg-muted text-sm font-semibold tabular-nums text-foreground">
        {result}{suffix}
      </output>
      <NumericInput label={`Bônus de ${label}`} value={bonus} onChange={onBonusChange} className="h-10 w-full rounded-xl bg-background/70" />
    </div>
  )
}

export function CharacterStats({ attributes, info, stats, onAttributeChange, onStatsChange }: Props) {
  const snapshot = calculateCharacterStatSnapshot(attributes, info, stats)
  const selectedElement = getCharacterElement(stats.elementId)

  function restoreStatistics() {
    onStatsChange({
      pv: snapshot.pvMax,
      pa: snapshot.paMax,
      pe: snapshot.peMax,
      peTemporary: snapshot.peMax,
      paExtra: 0,
      determination: snapshot.determinationMax,
      casualty: snapshot.casualtyMax,
    })
  }

  function changeElement(elementId: string) {
    const element = getCharacterElement(elementId)
    onStatsChange({
      elementId,
      resistances: element ? [...element.resistances] : [],
      weaknesses: element ? [...element.weaknesses] : [],
    })
  }

  return (
    <section aria-labelledby="character-statistics-title" className="rounded-b-[27px] rounded-t-none border border-border bg-card p-4 shadow-sm sm:p-7">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="character-statistics-title" className="text-lg text-muted-foreground">Estatísticas do personagem.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Valores calculados são atualizados automaticamente a partir da ficha.</p>
        </div>
        <button
          type="button"
          onClick={restoreStatistics}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <RefreshCcw className="size-4" />
          Restaurar estatísticas
        </button>
      </header>

      <div className="space-y-3">
        {attributeGroups.map((group) => {
          const styles = groupStyles[group.id]
          return (
            <div key={group.id}>
              <div className="rounded-[22px] border border-border bg-muted/45 p-4 sm:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("text-base font-bold uppercase", styles.label)}>{group.name}</span>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {group.primary.name}
                    <NumericInput
                      label={group.primary.name}
                      value={attributes[group.primary.key]}
                      onChange={(value) => onAttributeChange(group.primary.key, value)}
                      min={1}
                      className="h-14 w-20 rounded-2xl border border-border bg-card text-xl font-bold shadow-sm"
                    />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {group.attributes.map((attribute) => (
                    <label key={attribute.key} className="flex min-w-0 flex-col items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span className="w-full truncate text-center">{attribute.name}</span>
                      <span className={cn("flex h-14 w-full min-w-0 items-center justify-center rounded-2xl", styles.bubble)}>
                        <NumericInput
                          label={attribute.name}
                          value={attributes[attribute.key]}
                          max={attributes[group.primary.key]}
                          min={0}
                          onChange={(value) => onAttributeChange(attribute.key, value)}
                          className="h-14 w-full text-xl font-bold text-[#29263a]"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="hidden grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid">
                <span className={cn("text-right text-base font-bold uppercase", styles.label)}>{group.name}</span>
                <div className={cn("grid min-w-0 grid-cols-[4rem_repeat(3,minmax(0,1fr))] items-center overflow-hidden rounded-[18px]", styles.track)}>
                  <NumericInput
                    label={group.primary.name}
                    value={attributes[group.primary.key]}
                    onChange={(value) => onAttributeChange(group.primary.key, value)}
                    min={1}
                    className="h-11 w-full rounded-[18px] bg-card/80 font-semibold dark:bg-[#2e323f]"
                  />
                  {group.attributes.map((attribute) => (
                    <label key={attribute.key} className="flex min-w-0 items-center justify-end gap-2 pl-2 text-base text-foreground/80">
                      <span className="truncate lowercase">{attribute.name}</span>
                      <span className={cn("flex h-11 w-14 shrink-0 items-center justify-center rounded-[18px]", styles.bubble)}>
                        <NumericInput
                          label={attribute.name}
                          value={attributes[attribute.key]}
                          max={attributes[group.primary.key]}
                          min={0}
                          onChange={(value) => onAttributeChange(attribute.key, value)}
                          className="h-11 w-12 text-[#29263a]"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="my-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <VitalCard label="PV" current={stats.pv} maximum={snapshot.pvMax} bonus={stats.pvBonus} onCurrentChange={(pv) => onStatsChange({ pv })} onBonusChange={(pvBonus) => onStatsChange({ pvBonus })} accent="#d88787" />
        <VitalCard label="PA" current={stats.pa} maximum={snapshot.paMax} bonus={stats.paBonus} onCurrentChange={(pa) => onStatsChange({ pa })} onBonusChange={(paBonus) => onStatsChange({ paBonus })} accent="#6fbbb9" />
        <VitalCard label="PE" current={stats.pe} maximum={snapshot.peMax} bonus={stats.peBonus} onCurrentChange={(pe) => onStatsChange({ pe })} onBonusChange={(peBonus) => onStatsChange({ peBonus })} accent="#94a6db" />
      </div>

      <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid grid-cols-[minmax(0,1fr)_5rem] overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <span className="flex items-center px-4 text-sm font-semibold text-[#397d75] dark:text-[#79cfca]">
            PA Extra <small className="ml-1 font-normal text-muted-foreground">(máx. {snapshot.paExtraMax})</small>
          </span>
          <NumericInput label="PA Extra" value={Math.min(stats.paExtra, snapshot.paExtraMax)} min={0} max={snapshot.paExtraMax} onChange={(paExtra) => onStatsChange({ paExtra })} className="h-11 w-full bg-[#a9dfdc]/65 font-semibold" />
        </label>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_5rem] overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <button
            type="button"
            onClick={() => onStatsChange({ peTemporary: snapshot.peMax })}
            title="Restaurar PE temporário"
            aria-label="Restaurar PE temporário"
            className="flex h-11 items-center gap-1.5 border-r border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden lg:inline">Restaurar</span>
          </button>
          <span className="flex items-center px-3 text-sm font-semibold text-[#66749a] dark:text-[#c7d1f5]">PE Temporário</span>
          <NumericInput label="PE Temporário" value={stats.peTemporary} min={0} onChange={(peTemporary) => onStatsChange({ peTemporary })} className="h-11 w-full bg-[#d2ddff]/75 font-semibold" />
        </div>
      </div>

      <div className="rounded-[24px] border border-border bg-muted/25 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3">
          <TokenInput label="Resistências" values={stats.resistances} suggestions={damageSuggestions} onChange={(resistances) => onStatsChange({ resistances })} />
          <TokenInput label="Fraquezas" values={stats.weaknesses} suggestions={damageSuggestions} onChange={(weaknesses) => onStatsChange({ weaknesses })} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.85fr)]">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-1.5 block px-2 text-sm font-medium text-muted-foreground">Elemento Principal</span>
              <span className="relative block">
                <select
                  value={stats.elementId}
                  onChange={(event) => changeElement(event.target.value)}
                  className="h-12 w-full appearance-none rounded-[18px] border border-input bg-background px-4 pr-11 text-base font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
                  style={selectedElement ? { borderColor: selectedElement.color } : undefined}
                >
                  {elementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </span>
              {selectedElement && (
                <span className="mt-1.5 block px-2 text-xs text-muted-foreground">
                  {selectedElement.kind}{selectedElement.fusion ? ` · ${selectedElement.fusion}` : ""}
                </span>
              )}
            </label>

            <div className="space-y-2">
              <ResourceRow label="Determinação" current={stats.determination} maximum={snapshot.determinationMax} bonus={stats.determinationBonus} onCurrentChange={(determination) => onStatsChange({ determination })} onBonusChange={(determinationBonus) => onStatsChange({ determinationBonus })} color="#aaa438" />
              <ResourceRow label="Casualidade" current={stats.casualty} maximum={snapshot.casualtyMax} bonus={stats.casualtyBonus} onCurrentChange={(casualty) => onStatsChange({ casualty })} onBonusChange={(casualtyBonus) => onStatsChange({ casualtyBonus })} color="#b95c9b" />
            </div>

            <div className="rounded-[20px] border border-border bg-background/55 p-3">
              <div className="grid grid-cols-[minmax(5rem,1fr)_repeat(3,minmax(3rem,0.7fr))] items-stretch overflow-hidden rounded-[16px] border border-border sm:grid-cols-[minmax(7rem,1fr)_repeat(3,minmax(4rem,0.7fr))]">
                <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground">Carga (kg)</span>
                <label className="flex flex-col items-center border-l border-border px-1 py-2">
                  <span className="text-[0.62rem] text-muted-foreground">Atual</span>
                  <NumericInput label="Carga atual" value={stats.currentLoad} min={0} onChange={(currentLoad) => onStatsChange({ currentLoad })} className="w-full font-semibold" />
                </label>
                <label className="flex flex-col items-center border-l border-border bg-muted/35 px-1 py-2">
                  <span className="text-[0.62rem] text-muted-foreground">Base</span>
                  <NumericInput label="Carga base" value={snapshot.loadCapacity} readOnly className="w-full text-muted-foreground" />
                </label>
                <label className="flex flex-col items-center border-l border-border px-1 py-2">
                  <span className="text-[0.62rem] text-muted-foreground">Bônus</span>
                  <NumericInput label="Bônus de carga" value={stats.loadBonus} onChange={(loadBonus) => onStatsChange({ loadBonus })} className="w-full" />
                </label>
              </div>
              {snapshot.overweightLevel > 0 && (
                <div className="mt-3 px-2 text-sm italic leading-relaxed">
                  <p className="font-semibold text-yellow-foreground">
                    Sobrepeso {snapshot.overweightLevel}: -{snapshot.physicalPenalty} Físico, -{snapshot.movementPenalty} Desloc.
                  </p>
                  {snapshot.overweightWarnings.length > 0 && (
                    <p className="font-bold text-destructive">{snapshot.overweightWarnings.join(", ")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-[20px] border border-border bg-background/55 p-3">
                <div className="mb-2 grid grid-cols-[minmax(5.5rem,1fr)_4rem_4rem] gap-1.5 text-center text-[0.65rem] text-muted-foreground sm:grid-cols-[minmax(6.5rem,1fr)_5rem_5rem]">
                  <span />
                  <span>Teste</span>
                  <span>Bônus</span>
                </div>
                <div className="space-y-2">
                  <TestRow label="Vontade" result={snapshot.willTest} bonus={stats.willBonus} onBonusChange={(willBonus) => onStatsChange({ willBonus })} />
                  <TestRow label="Acaso" result={snapshot.chanceTest} bonus={stats.chanceBonus} onBonusChange={(chanceBonus) => onStatsChange({ chanceBonus })} />
                  <TestRow label="Percepção" result={snapshot.perceptionTest} bonus={stats.perceptionBonus} onBonusChange={(perceptionBonus) => onStatsChange({ perceptionBonus })} />
                  <TestRow label="Deslocamento" result={snapshot.movement} suffix=" m" bonus={stats.movementBonus} onBonusChange={(movementBonus) => onStatsChange({ movementBonus })} />
                </div>
              </div>

              <div className="rounded-[20px] border border-border bg-background/55 p-3">
                <div className="mb-2 grid grid-cols-[minmax(6rem,1fr)_4.5rem_4.5rem] gap-1.5 text-center text-[0.65rem] text-muted-foreground">
                  <span />
                  <span>RDF</span>
                  <span>RDM</span>
                </div>
                <div className="space-y-2">
                  {([
                    ["Armadura", "armorRdf", "armorRdm"],
                    ["Natural", "naturalRdf", "naturalRdm"],
                  ] as const).map(([label, rdfKey, rdmKey]) => (
                    <div key={label} className="grid grid-cols-[minmax(6rem,1fr)_4.5rem_4.5rem] items-center gap-1.5">
                      <span className="text-right text-sm text-muted-foreground">{label}</span>
                      <NumericInput label={`${label} RDF`} value={stats[rdfKey]} min={0} onChange={(value) => onStatsChange({ [rdfKey]: value })} className="h-10 w-full rounded-xl bg-background/70" />
                      <NumericInput label={`${label} RDM`} value={stats[rdmKey]} min={0} onChange={(value) => onStatsChange({ [rdmKey]: value })} className="h-10 w-full rounded-xl bg-background/70" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-xs font-semibold text-muted-foreground">
                    <Shield className="size-3.5" /> RDF total {snapshot.totalRdf}
                  </span>
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-xs font-semibold text-muted-foreground">
                    <Sparkles className="size-3.5" /> RDM total {snapshot.totalRdm}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <RichTextEditor label="Efeitos" value={stats.effects} onChange={(effects) => onStatsChange({ effects })} maxLength={1000} />
        </div>
      </div>
    </section>
  )
}
