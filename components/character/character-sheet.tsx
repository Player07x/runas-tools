"use client"

import { useState } from "react"
import type { AttributeKey, CharacterCalendar, CharacterInfo as InfoType, CharacterStats as StatsType } from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { convertCalendarYear, deriveCharacterInfo, modifierToNumber } from "@/lib/characterCalculations"
import { cn } from "@/lib/utils"
import { useCharacter } from "./character-provider"
import { CharacterInfo } from "./character-info"
import { CharacterStats } from "./character-stats"
import { CharacterActions } from "./character-actions"
import { SaveIndicator } from "./save-indicator"

type CharacterTab = "information" | "statistics" | "skills"

const unavailableTabs = ["Vínculos", "Inventário", "Magias", "Anotações"]
const availableTabs: { id: CharacterTab | "abilities"; label: string }[] = [
  { id: "information", label: "Informação" },
  { id: "statistics", label: "Estatísticas" },
  { id: "skills", label: "Perícias" },
  { id: "abilities", label: "Habilidades" },
]

export function CharacterSheet() {
  const { character, updateCharacter, isReady } = useCharacter()
  const [activeTab, setActiveTab] = useState<CharacterTab>("information")

  function setName(value: string) {
    updateCharacter((prev) => ({ ...prev, name: value.slice(0, 80) }))
  }

  function setInfo(key: keyof InfoType, value: string) {
    updateCharacter((prev) => {
      let nextInfo: InfoType = { ...prev.info, [key]: value }
      if (key === "calendar" && (value === "logi" || value === "ce")) {
        nextInfo = {
          ...nextInfo,
          currentYear: convertCalendarYear(prev.info.currentYear, prev.info.calendar, value as CharacterCalendar),
          calendar: value,
        }
      }
      nextInfo = deriveCharacterInfo(nextInfo)
      return {
        ...prev,
        info: nextInfo,
        stats: { ...prev.stats, mt: modifierToNumber(nextInfo.sizeModifier) },
      }
    })
  }

  function setAttribute(key: AttributeKey, value: number) {
    updateCharacter((prev) => {
      const attributes = { ...prev.attributes }
      const group = attributeGroups.find((item) => item.primary.key === key || item.attributes.some((attr) => attr.key === key))
      if (!group) return prev
      if (group.primary.key === key) {
        const primary = Math.max(0, Math.floor(value || 0))
        attributes[key] = primary
        for (const attribute of group.attributes) attributes[attribute.key] = Math.min(attributes[attribute.key], primary)
      } else {
        attributes[key] = Math.min(attributes[group.primary.key], Math.max(0, Math.floor(value || 0)))
      }
      return { ...prev, attributes }
    })
  }

  function setStat(key: keyof StatsType, value: number) {
    updateCharacter((prev) => ({ ...prev, stats: { ...prev.stats, [key]: value } }))
  }

  if (!isReady) {
    return <p className="px-4 py-8 text-sm text-panel-muted">Carregando ficha…</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-panel-border/50 bg-panel-elevated px-4 py-4 shadow-lg sm:px-5">
        <SaveIndicator />
        <CharacterActions />
      </section>

      <div className="min-w-0">
        <div role="tablist" aria-label="Seções da ficha" className="scrollbar-none flex gap-1.5 overflow-x-auto rounded-2xl border border-panel-border/45 bg-panel-input/55 p-1.5">
          {availableTabs.map((tab) => {
            const isAvailable = tab.id !== "abilities"
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                disabled={!isAvailable}
                onClick={isAvailable ? () => setActiveTab(tab.id as CharacterTab) : undefined}
                aria-selected={isActive}
                role="tab"
                className={cn(
                  "h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition-all",
                  isActive ? "bg-panel-elevated text-white shadow-md" : "text-panel-muted hover:bg-panel-elevated/60 hover:text-white",
                  !isAvailable && "cursor-not-allowed opacity-45 hover:bg-transparent",
                )}
              >
                {tab.label}
              </button>
            )
          })}
          {unavailableTabs.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title="Ainda não disponível"
              className="h-10 shrink-0 cursor-not-allowed rounded-xl px-4 text-sm font-bold text-panel-muted opacity-45"
            >
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="mt-3">
          {activeTab === "information" && (
            <CharacterInfo name={character.name} info={character.info} onNameChange={setName} onInfoChange={setInfo} />
          )}
          {activeTab === "statistics" && (
            <CharacterStats
              attributes={character.attributes}
              stats={character.stats}
              loadBase={character.info.loadBase}
              onAttributeChange={setAttribute}
              onStatChange={setStat}
              onLoadBaseChange={(value) => setInfo("loadBase", value)}
            />
          )}
          {activeTab === "skills" && (
            <section className="min-h-[32rem] rounded-2xl border border-panel-border/45 bg-panel-elevated p-5 sm:p-7">
              <p className="text-base text-panel-muted">Perícias e testes do personagem.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
