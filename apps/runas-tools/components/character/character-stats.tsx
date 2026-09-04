"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Minus, Plus, RefreshCcw, RotateCcw, Sparkles } from "lucide-react"
import type {
  AttributeKey,
  CharacterAbility,
  CharacterAttributes,
  CharacterInfo,
  CharacterSkill,
  CharacterStats as CharacterStatsType,
} from "@runas/core/types/character"
import { attributeGroups } from "@runas/core/data/attributes"
import { damageTypes } from "@runas/core/data/damageTypes"
import { elementOptions, getCharacterElement } from "@runas/core/data/elements"
import { calculateCharacterStatSnapshot } from "@runas/core/lib/characterStatCalculations"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { TokenInput } from "@/components/ui/token-input"
import {
  calculateMasteryImprovementPoints,
  calculateSpentMasteryImprovementPoints,
  masteryImprovementOptions,
  type MasteryImprovementKey,
} from "@runas/core/lib/masteryImprovements"

interface Props {
  attributes: CharacterAttributes
  info: CharacterInfo
  stats: CharacterStatsType
  skills: CharacterSkill[]
  abilities: CharacterAbility[]
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
  "Todos os Danos",
  "Todos os Danos Físicos",
  "Todos os Danos Mágicos",
]

function formatSignedInteger(value: number): string {
  const integer = Math.trunc(Number.isFinite(value) ? value : 0)
  return `${integer >= 0 ? "+" : ""}${integer}`
}

function NumericInput({
  value,
  onChange,
  label,
  min,
  max,
  readOnly,
  fallbackValue,
  className,
}: {
  value: number
  onChange?: (value: number) => void
  label: string
  min?: number
  max?: number
  readOnly?: boolean
  fallbackValue?: number
  className?: string
}) {
  const editing = useRef(false)
  const [draft, setDraft] = useState(() => String(Number.isFinite(value) ? value : 0))

  useEffect(() => {
    if (!editing.current) setDraft(String(Number.isFinite(value) ? value : 0))
  }, [value])

  function commitDraft() {
    editing.current = false
    const parsed = Number(draft)
    const fallback = fallbackValue ?? (min !== undefined && min > 0 ? min : 0)
    const next = draft.trim() === "" || !Number.isFinite(parsed)
      ? fallback
      : Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, parsed))
    setDraft(String(next))
    if (onChange && next !== value) onChange(next)
  }

  return (
    <input
      aria-label={label}
      type="number"
      inputMode="numeric"
      value={draft}
      min={min}
      max={max}
      readOnly={readOnly || !onChange}
      onFocus={() => { editing.current = true }}
      onBlur={commitDraft}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      onChange={onChange ? (event) => {
        setDraft(event.target.value)
      } : undefined}
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
  accentClass,
}: {
  label: string
  current: number
  maximum: number
  bonus: number
  onCurrentChange: (value: number) => void
  onBonusChange: (value: number) => void
  accentClass: string
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-border bg-muted/35 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
        <h3 className={cn("font-bold", accentClass)}>{label} Atual</h3>
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
          <span className="text-[0.68rem] font-medium text-muted-foreground">Mod.</span>
          <NumericInput label={`Modificador de ${label}`} value={bonus} onChange={onBonusChange} className="w-full text-xl" />
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
  colorClass,
}: {
  label: string
  current: number
  maximum: number
  bonus: number
  onCurrentChange: (value: number) => void
  onBonusChange: (value: number) => void
  colorClass: string
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-background/60">
      <span className={cn("block px-3 py-2 text-sm font-bold", colorClass)}>{label}</span>
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <label className="flex min-w-0 flex-col items-center justify-center px-1 py-2">
          <span className="text-[0.62rem] text-muted-foreground">Atual</span>
          <NumericInput label={`${label} atual`} value={current} onChange={onCurrentChange} min={0} className="w-full font-semibold" />
        </label>
        <label className="flex min-w-0 flex-col items-center justify-center bg-muted/35 px-1 py-2">
          <span className="text-[0.62rem] text-muted-foreground">Máximo</span>
          <NumericInput label={`${label} máximo`} value={maximum} readOnly className="w-full text-muted-foreground" />
        </label>
        <label className="flex min-w-0 flex-col items-center justify-center px-1 py-2">
          <span className="text-[0.62rem] text-muted-foreground">Mod.</span>
          <NumericInput label={`Modificador de ${label}`} value={bonus} onChange={onBonusChange} className="w-full" />
        </label>
      </div>
    </div>
  )
}

export function CharacterStats({ attributes, info, stats, skills, abilities, onAttributeChange, onStatsChange }: Props) {
  const snapshot = calculateCharacterStatSnapshot(attributes, info, stats, skills, abilities)
  const selectedElement = getCharacterElement(stats.elementId)
  const peTemporaryValue = Math.min(snapshot.peTemporaryMax, Math.max(0, stats.peTemporary))
  const peTemporaryPercentage = snapshot.peTemporaryMax > 0
    ? Math.min(100, Math.max(0, (peTemporaryValue / snapshot.peTemporaryMax) * 100))
    : 0
  const masteryPoints = calculateMasteryImprovementPoints(info)
  const spentMasteryPoints = calculateSpentMasteryImprovementPoints(stats.masteryImprovements)
  const remainingMasteryPoints = masteryPoints - spentMasteryPoints

  function adjustMasteryImprovement(key: MasteryImprovementKey, delta: -1 | 1) {
    const option = masteryImprovementOptions.find((candidate) => candidate.key === key)
    if (!option) return
    const current = stats.masteryImprovements[key]
    if (delta < 0 && current <= 0) return
    if (delta > 0 && remainingMasteryPoints < option.cost) return
    onStatsChange({
      masteryImprovements: {
        ...stats.masteryImprovements,
        [key]: Math.max(0, current + delta),
      },
    })
  }

  function restoreStatistics() {
    onStatsChange({
      pv: snapshot.pvMax,
      pa: snapshot.paMax,
      pe: snapshot.peMax,
      peTemporary: snapshot.peTemporaryMax,
      paExtra: 0,
      determination: snapshot.determinationMax,
      casualty: snapshot.casualtyMax,
      focusCurrent: snapshot.focusMaximum,
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

  function adjustPeTemporary(delta: number) {
    onStatsChange({
      peTemporary: Math.min(snapshot.peTemporaryMax, Math.max(0, stats.peTemporary + delta)),
    })
  }

  return (
    <section aria-label="Estatísticas do personagem" className="rounded-b-[27px] rounded-t-none border border-border bg-card p-4 shadow-sm sm:p-7">
      <header className="mb-4 flex justify-end">
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
                  <span className={cn("text-sm font-bold uppercase", styles.label)}>{group.name}</span>
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
                    <label key={attribute.key} className="flex min-w-0 flex-col items-center gap-2 font-medium text-muted-foreground">
                      <span className="w-full text-center text-[clamp(0.65rem,3.3vw,0.875rem)] leading-tight">{attribute.name}</span>
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
                <span className={cn("text-right text-sm font-bold uppercase", styles.label)}>{group.name}</span>
                <div className={cn("grid min-w-0 grid-cols-[4rem_repeat(3,minmax(0,1fr))] items-center overflow-hidden rounded-[18px]", styles.track)}>
                  <NumericInput
                    label={group.primary.name}
                    value={attributes[group.primary.key]}
                    onChange={(value) => onAttributeChange(group.primary.key, value)}
                    min={1}
                    className="h-11 w-full rounded-[18px] bg-card/80 font-semibold dark:bg-[#2e323f]"
                  />
                  {group.attributes.map((attribute) => (
                    <label key={attribute.key} className="flex min-w-0 items-center justify-end gap-2 pl-2 text-sm text-foreground/80">
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
        <VitalCard label="PV" current={stats.pv} maximum={snapshot.pvMax} bonus={stats.pvBonus} onCurrentChange={(pv) => onStatsChange({ pv })} onBonusChange={(pvBonus) => onStatsChange({ pvBonus })} accentClass="text-[#9f4d4d] dark:text-[#ef9696]" />
        <VitalCard label="PA" current={stats.pa} maximum={snapshot.paMax} bonus={stats.paBonus} onCurrentChange={(pa) => onStatsChange({ pa })} onBonusChange={(paBonus) => onStatsChange({ paBonus })} accentClass="text-[#397d75] dark:text-[#79cfca]" />
        <VitalCard label="PE" current={stats.pe} maximum={snapshot.peMax} bonus={stats.peBonus} onCurrentChange={(pe) => onStatsChange({ pe })} onBonusChange={(peBonus) => onStatsChange({ peBonus })} accentClass="text-[#586b9f] dark:text-[#c7d1f5]" />
      </div>

      <div className="mb-7 grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
        <article className="overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <h3 className="px-3 py-2 text-sm font-semibold text-[#397d75] dark:text-[#79cfca]">PA Extra</h3>
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Atual</span>
              <NumericInput label="PA Extra atual" value={Math.min(stats.paExtra, snapshot.paExtraMax)} min={0} max={snapshot.paExtraMax} onChange={(paExtra) => onStatsChange({ paExtra })} className="h-8 w-full font-semibold" />
            </label>
            <label className="flex min-w-0 flex-col items-center bg-muted/35 px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Máximo</span>
              <NumericInput label="PA Extra máximo" value={snapshot.paExtraMax} readOnly className="h-8 w-full text-muted-foreground" />
            </label>
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Mod.</span>
              <NumericInput label="Modificador de PA Extra" value={stats.paExtraBonus} onChange={(paExtraBonus) => onStatsChange({ paExtraBonus })} className="h-8 w-full" />
            </label>
          </div>
        </article>
        <article className="overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <div className="flex min-h-10 items-center justify-between gap-2 px-3 py-1.5">
            <h3 className="min-w-0 text-sm font-semibold text-[#66749a] dark:text-[#c7d1f5]">PE Temporário</h3>
            <button
              type="button"
              onClick={() => onStatsChange({ peTemporary: snapshot.peTemporaryMax })}
              title="Restaurar PE temporário"
              aria-label="Restaurar PE temporário"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>Restaurar</span>
            </button>
          </div>
          <div className="relative overflow-hidden border-t border-border">
            <div
              role="progressbar"
              aria-label="Proporção de PE temporário"
              aria-valuemin={0}
              aria-valuemax={snapshot.peTemporaryMax}
              aria-valuenow={peTemporaryValue}
              style={{ width: `${peTemporaryPercentage}%` }}
              className="absolute inset-y-0 left-0 bg-[#aebfee]/55 transition-[width] duration-500 ease-out motion-reduce:transition-none dark:bg-[#53658f]/55"
            />
            <div className="relative z-10 grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-stretch divide-x divide-border">
              <button
                type="button"
                onClick={() => adjustPeTemporary(-1)}
                disabled={stats.peTemporary <= 0}
                aria-label="Reduzir PE temporário em 1"
                className="flex min-h-14 items-center justify-center text-sm font-bold text-muted-foreground transition hover:bg-background/65 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Minus className="size-3.5" />1
              </button>
              <label className="flex min-w-0 items-center justify-center gap-1 bg-background/20 px-2">
                <NumericInput label="PE Temporário" value={peTemporaryValue} min={0} max={snapshot.peTemporaryMax} onChange={(peTemporary) => onStatsChange({ peTemporary })} className="h-10 w-12 font-semibold" />
                <span className="text-xs tabular-nums text-muted-foreground">/ {snapshot.peTemporaryMax}</span>
              </label>
              <button
                type="button"
                onClick={() => adjustPeTemporary(1)}
                disabled={stats.peTemporary >= snapshot.peTemporaryMax}
                aria-label="Aumentar PE temporário em 1"
                className="flex min-h-14 items-center justify-center text-sm font-bold text-muted-foreground transition hover:bg-background/65 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Plus className="size-3.5" />1
              </button>
            </div>
          </div>
        </article>
        <article className="overflow-hidden rounded-[18px] border border-border bg-muted/45 sm:col-span-2">
          <h3 className="px-3 py-2 text-sm font-semibold text-[#8a6f2f] dark:text-[#e2c56d]">Tempo de Foco</h3>
          <div className="grid grid-cols-3 divide-x divide-border border-y border-border">
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Atual</span>
              <NumericInput label="Tempo de Foco atual" value={stats.focusCurrent} min={0} max={snapshot.focusMaximum} onChange={(focusCurrent) => onStatsChange({ focusCurrent })} className="h-8 w-full font-semibold" />
            </label>
            <label className="flex min-w-0 flex-col items-center bg-muted/35 px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Máximo</span>
              <NumericInput label="Tempo de Foco máximo" value={snapshot.focusMaximum} readOnly className="h-8 w-full text-muted-foreground" />
            </label>
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Mod.</span>
              <NumericInput label="Modificador de Tempo de Foco" value={stats.focusModifier} onChange={(focusModifier) => onStatsChange({ focusModifier })} className="h-8 w-full" />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onStatsChange({ focusCurrent: snapshot.focusMaximum })}
            className="flex min-h-11 w-full items-center justify-center gap-2 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground"
          >
            <RotateCcw className="size-3.5" /> Tempo de Descanso: {snapshot.restMinutes} min.
          </button>
        </article>
        <article className="overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <h3 className="px-3 py-2 text-sm font-semibold text-[#57747d] dark:text-[#a9d2de]">Deslocamento</h3>
          <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Atual</span>
              <output aria-label={`Deslocamento atual: ${snapshot.movement} m`} className="flex h-8 w-full items-center justify-center text-base font-semibold tabular-nums text-foreground">
                {snapshot.movement} m
              </output>
            </label>
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Mod.</span>
              <NumericInput label="Modificador de deslocamento" value={stats.movementBonus} onChange={(movementBonus) => onStatsChange({ movementBonus })} className="h-8 w-full" />
            </label>
          </div>
        </article>
        <article className="overflow-hidden rounded-[18px] border border-border bg-muted/45">
          <h3 className="px-3 py-2 text-sm font-semibold text-[#6b5b8d] dark:text-[#c9b9ef]">Primeiras Impressões</h3>
          <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Bônus</span>
              <output aria-label={`Bônus de Primeiras Impressões: ${formatSignedInteger(snapshot.firstImpressionsBonus)}`} className="flex h-8 w-full items-center justify-center text-base font-semibold tabular-nums text-foreground">
                {formatSignedInteger(snapshot.firstImpressionsBonus)}
              </output>
            </label>
            <label className="flex min-w-0 flex-col items-center px-1 py-2">
              <span className="text-[0.62rem] text-muted-foreground">Mod.</span>
              <NumericInput label="Modificador de Primeiras Impressões" value={stats.firstImpressionsBonus} onChange={(firstImpressionsBonus) => onStatsChange({ firstImpressionsBonus: Math.trunc(firstImpressionsBonus) })} className="h-8 w-full" />
            </label>
          </div>
        </article>
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
                  className="h-12 w-full appearance-none rounded-[18px] border border-input bg-background px-4 pr-11 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
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
              <ResourceRow label="Determinação" current={stats.determination} maximum={snapshot.determinationMax} bonus={stats.determinationBonus} onCurrentChange={(determination) => onStatsChange({ determination })} onBonusChange={(determinationBonus) => onStatsChange({ determinationBonus })} colorClass="text-[#706d1f] dark:text-[#e2c56d]" />
              <ResourceRow label="Casualidade" current={stats.casualty} maximum={snapshot.casualtyMax} bonus={stats.casualtyBonus} onCurrentChange={(casualty) => onStatsChange({ casualty })} onBonusChange={(casualtyBonus) => onStatsChange({ casualtyBonus })} colorClass="text-[#93447d] dark:text-[#eca9ea]" />
            </div>

          </div>

          <RichTextEditor label="Efeitos" value={stats.effects} onChange={(effects) => onStatsChange({ effects })} maxLength={1000} />
        </div>
      </div>

      <article className="mt-7 overflow-hidden rounded-[20px] border border-border bg-muted/30">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h3 className="font-bold text-foreground">Melhoria de Maestria</h3></div>
            <p className="mt-1 text-xs text-muted-foreground">Pontos definidos por Afinidade {info.affinity} e Eficiência {info.efficiency}%.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Total <strong className="text-foreground">{masteryPoints}</strong></span>
            <span className="text-muted-foreground">Usados <strong className="text-foreground">{spentMasteryPoints}</strong></span>
            <span className={remainingMasteryPoints < 0 ? "text-destructive" : "text-muted-foreground"}>Restantes <strong className="text-current">{remainingMasteryPoints}</strong></span>
          </div>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {masteryImprovementOptions.map((option) => {
            const quantity = stats.masteryImprovements[option.key]
            const canBuy = remainingMasteryPoints >= option.cost
            return <div key={option.key} className="flex min-w-0 flex-col justify-between gap-3 bg-card/95 p-3.5">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2"><strong className={`min-w-0 text-sm ${option.color}`}>{option.name}</strong><span className="shrink-0 rounded-full border border-border bg-background/70 px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">{option.cost} pts.</span></div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[0.68rem] font-medium text-muted-foreground">Compradas</span>
                <div className="flex shrink-0 items-center rounded-lg border border-border bg-background/70">
                  <button type="button" onClick={() => adjustMasteryImprovement(option.key, -1)} disabled={quantity === 0} aria-label={`Remover uma melhoria de ${option.name}`} className="inline-flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"><Minus className="size-3.5" /></button>
                  <output aria-label={`${quantity} melhorias de ${option.name}`} className="min-w-6 text-center text-sm font-bold tabular-nums text-foreground">{quantity}</output>
                  <button type="button" onClick={() => adjustMasteryImprovement(option.key, 1)} disabled={!canBuy} aria-label={`Comprar uma melhoria de ${option.name} por ${option.cost} pontos`} className="inline-flex size-8 items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-30"><Plus className="size-3.5" /></button>
                </div>
              </div>
            </div>
          })}
        </div>
        {remainingMasteryPoints < 0 && <p role="alert" className="border-t border-destructive/25 bg-destructive/8 px-4 py-2 text-xs text-destructive">As melhorias excedem os pontos atuais. Remova compras ou aumente Afinidade/Eficiência.</p>}
      </article>
    </section>
  )
}
