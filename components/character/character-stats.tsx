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
  onLoadBaseChange: (value: string) => void
}

const groupStyles = {
  physical: { label: "text-[#df8b8b]", track: "bg-[#a34e4e]", bubble: "bg-[#cd7a7a]" },
  mental: { label: "text-[#e2a1df]", track: "bg-[#a34e8a]", bubble: "bg-[#c991cd]" },
  mystic: { label: "text-[#a8d1a1]", track: "bg-[#4ea366]", bubble: "bg-[#a8d1a1]" },
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
      className={cn("bg-transparent text-center text-lg text-white outline-none", className)}
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
      <span className="text-base font-bold" style={{ color }}>{label}</span>
      <span
        className={cn(
          "flex size-28 items-center justify-center shadow-[0_12px_24px_rgba(23,28,43,0.18)]",
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
          className="w-20 bg-transparent text-center text-4xl text-[#2e3548] outline-none"
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
  onLoadBaseChange,
}: Props) {
  return (
    <section aria-labelledby="character-statistics-title" className="rounded-[27px] bg-[#4c587b] p-5 sm:p-7">
      <p id="character-statistics-title" className="mb-6 text-lg text-[#acbfd1]">Estatísticas do personagem.</p>

      <div className="space-y-3">
        {attributeGroups.map((group) => {
          const styles = groupStyles[group.id]
          return (
            <div key={group.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
              <span className={cn("text-right text-sm font-bold uppercase sm:text-base", styles.label)}>{group.name}</span>
              <div className={cn("grid min-w-0 grid-cols-[4rem_repeat(3,minmax(0,1fr))] items-center overflow-hidden rounded-[18px]", styles.track)}>
                <NumericInput
                  label={group.primary.name}
                  value={attributes[group.primary.key]}
                  onChange={(value) => onAttributeChange(group.primary.key, value)}
                  className="h-11 w-full rounded-[18px] bg-[#2e323f]"
                />
                {group.attributes.map((attribute) => (
                  <label key={attribute.key} className="flex min-w-0 items-center justify-end gap-1 pl-2 text-sm text-[#d0d7e4] sm:gap-2 sm:text-base">
                    <span className="truncate lowercase">{attribute.name}</span>
                    <span className={cn("flex h-11 w-14 shrink-0 items-center justify-center rounded-[18px]", styles.bubble)}>
                      <NumericInput
                        label={attribute.name}
                        value={attributes[attribute.key]}
                        max={attributes[group.primary.key]}
                        onChange={(value) => onAttributeChange(attribute.key, value)}
                        className="h-11 w-12"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="my-8 grid grid-cols-1 gap-7 sm:grid-cols-3">
        <StatOrb label="PV" value={stats.pv} onChange={(value) => onStatChange("pv", value)} color="#d88787" shape="heart" />
        <StatOrb label="PA" value={stats.pa} onChange={(value) => onStatChange("pa", value)} color="#6fbbb9" shape="shield" />
        <StatOrb label="PE" value={stats.pe} onChange={(value) => onStatChange("pe", value)} color="#d2ddff" shape="circle" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <label className="flex flex-col gap-1.5">
          <span className="px-2 text-base text-[#acbfd1]">Base de Carga (kg)</span>
          <input
            value={loadBase}
            onChange={(event) => onLoadBaseChange(event.target.value)}
            inputMode="decimal"
            className="h-11 rounded-[18px] border border-transparent bg-[#383e4e] px-4 text-base text-white outline-none focus:border-[#d3cdff]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="px-2 text-base text-[#acbfd1]">MT</span>
          <NumericInput label="MT" value={stats.mt} className="h-11 w-full rounded-[18px] bg-[#2e323f] text-[#c8ceda]" />
        </label>
      </div>
    </section>
  )
}
