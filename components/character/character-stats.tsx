"use client"

import type { AttributeKey, CharacterAttributes, CharacterStats as CharacterStatsType } from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { cn } from "@/lib/utils"

interface Props {
  attributes: CharacterAttributes
  stats: CharacterStatsType
  loadBase: string
  onAttributeChange: (key: AttributeKey, value: number) => void
  onStatChange: (key: keyof CharacterStatsType, value: number) => void
}

const groupStyles = {
  physical: { label: "text-[#a34e4e] dark:text-[#df8b8b]", track: "bg-[#f4dada] dark:bg-[#a34e4e]", bubble: "bg-[#e5a6a6] dark:bg-[#cd7a7a]" },
  mental: { label: "text-[#93447d] dark:text-[#e2a1df]", track: "bg-[#f2d8ed] dark:bg-[#a34e8a]", bubble: "bg-[#dda9d8] dark:bg-[#c991cd]" },
  mystic: { label: "text-[#397d4d] dark:text-[#a8d1a1]", track: "bg-[#d9eedc] dark:bg-[#4ea366]", bubble: "bg-[#a8d1a1] dark:bg-[#86bd91]" },
} as const

function NumericInput({
  value,
  onChange,
  label,
  min = 0,
  max,
  className,
}: {
  value: number
  onChange?: (value: number) => void
  label: string
  min?: number
  max?: number
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
      readOnly={!onChange}
      onChange={onChange ? (event) => onChange(Number(event.target.value) || 0) : undefined}
      className={cn("bg-transparent text-center text-base font-semibold text-white outline-none", className)}
    />
  )
}

function StatOrb({
  label,
  value,
  onChange,
  color,
  shape,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  color: string
  shape: "heart" | "shield" | "circle"
}) {
  return (
    <label className="flex min-w-0 flex-col items-center gap-2">
      <span className="text-sm font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
      <span
        className={cn(
          "flex size-24 items-center justify-center shadow-[0_12px_24px_rgba(23,28,43,0.22)] sm:size-28",
          shape === "circle" && "rounded-full",
          shape === "heart" && "rounded-[45%_45%_38%_38%] [clip-path:polygon(50%_100%,6%_58%,5%_28%,18%_8%,39%_7%,50%_21%,61%_7%,82%_8%,95%_28%,94%_58%)]",
          shape === "shield" && "[clip-path:polygon(50%_0,94%_20%,83%_72%,50%_100%,17%_72%,6%_20%)]",
        )}
        style={{ backgroundColor: color }}
      >
        <input
          aria-label={label}
          type="number"
          inputMode="numeric"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-20 bg-transparent text-center text-3xl font-bold text-[#2e3548] outline-none sm:text-4xl"
        />
      </span>
    </label>
  )
}

export function CharacterStats({
  attributes,
  stats,
  loadBase,
  onAttributeChange,
  onStatChange,
}: Props) {
  return (
    <section aria-labelledby="character-statistics-title" className="rounded-2xl border border-panel-border/45 bg-panel-elevated p-4 shadow-lg sm:p-6">
      <div className="mb-6">
        <h3 id="character-statistics-title" className="text-base font-bold text-white">Estatísticas</h3>
        <p className="mt-1 text-sm text-panel-muted">Atributos e recursos do personagem.</p>
      </div>

      <div className="space-y-3">
        {attributeGroups.map((group) => {
          const styles = groupStyles[group.id]
          return (
            <div key={group.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:items-center sm:gap-3">
              <span className={cn("text-left text-xs font-bold uppercase tracking-wide sm:text-right sm:text-sm", styles.label)}>{group.name}</span>
              <div className={cn("grid min-w-0 grid-cols-[3.75rem_repeat(3,minmax(0,1fr))] items-center overflow-hidden rounded-xl", styles.track)}>
                <NumericInput
                  label={group.primary.name}
                  value={attributes[group.primary.key]}
                  onChange={(value) => onAttributeChange(group.primary.key, value)}
                  className="h-11 w-full rounded-xl bg-panel-input"
                />
                {group.attributes.map((attribute) => (
                  <label key={attribute.key} className="flex min-w-0 items-center justify-end gap-1 pl-1.5 text-xs text-white/80 sm:gap-2 sm:pl-2 sm:text-sm">
                    <span className="truncate lowercase">{attribute.name}</span>
                    <span className={cn("flex h-11 w-12 shrink-0 items-center justify-center rounded-xl sm:w-14", styles.bubble)}>
                      <NumericInput
                        label={attribute.name}
                        value={attributes[attribute.key]}
                        max={attributes[group.primary.key]}
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

      <div className="my-8 grid grid-cols-3 gap-3 sm:gap-7">
        <StatOrb label="PV" value={stats.pv} onChange={(value) => onStatChange("pv", value)} color="#d88787" shape="heart" />
        <StatOrb label="PA" value={stats.pa} onChange={(value) => onStatChange("pa", value)} color="#6fbbb9" shape="shield" />
        <StatOrb label="PE" value={stats.pe} onChange={(value) => onStatChange("pe", value)} color="#d2ddff" shape="circle" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-sm font-medium text-panel-muted">Base de Carga (kg)</span>
          <input
            value={loadBase}
            readOnly
            inputMode="decimal"
            className="h-11 rounded-xl border border-panel-border/35 bg-panel-input px-3.5 text-sm text-white outline-none focus:border-highlight/70 focus:ring-3 focus:ring-highlight/15"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="px-1 text-sm font-medium text-panel-muted">MT</span>
          <NumericInput label="MT" value={stats.mt} className="h-11 w-full rounded-xl bg-panel-input/65 text-panel-muted" />
        </label>
      </div>
    </section>
  )
}
