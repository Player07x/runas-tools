"use client"

import { useState } from "react"
import type { AttributeKey, CharacterCalendar, CharacterInfo as InfoType, CharacterStats as StatsType } from "@/types/character"
import { attributeGroups } from "@/data/attributes"
import { calculateLoadBase, convertCalendarYear, deriveCharacterInfo, modifierToNumber } from "@/lib/characterCalculations"
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
      nextInfo.loadBase = calculateLoadBase(prev.attributes.physical, prev.attributes.strength, nextInfo.scaleMultiplier)
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
      return {
        ...prev,
        attributes,
        info: {
          ...prev.info,
          loadBase: calculateLoadBase(attributes.physical, attributes.strength, prev.info.scaleMultiplier),
        },
      }
    })
  }

  function setStat(key: keyof StatsType, value: number) {
    updateCharacter((prev) => ({ ...prev, stats: { ...prev.stats, [key]: value } }))
  }

  if (!isReady) {
    return <p className="px-4 py-8 text-sm text-muted-foreground">Carregando ficha…</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[27px] border border-border bg-card px-5 py-4 shadow-sm sm:px-7">
        <SaveIndicator />
        <CharacterActions />
      </section>

      <div className="relative">
        <div className="relative z-0 -mb-px grid grid-cols-2 gap-x-px sm:grid-cols-4">
          {unavailableTabs.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title="Ainda não disponível"
              className="h-14 rounded-t-[20px] border-t border-border bg-muted px-3 pb-px text-base font-bold text-muted-foreground disabled:cursor-not-allowed sm:h-12 sm:rounded-t-[27px] sm:px-2"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative z-20 grid grid-cols-2 gap-x-px bg-muted sm:grid-cols-4" role="tablist" aria-label="Seções da ficha">
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
                    "relative h-14 rounded-t-[20px] border-x border-t border-transparent px-3 text-base font-bold transition-colors sm:h-12 sm:rounded-t-[27px] sm:px-2",
                    isActive
                      ? "z-10 border-border bg-card text-foreground shadow-sm after:absolute after:-bottom-0.5 after:inset-x-0 after:h-1 after:bg-card"
                      : "bg-secondary text-secondary-foreground hover:bg-accent",
                    !isAvailable && "cursor-not-allowed opacity-60 hover:bg-secondary",
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
        </div>

        <div role="tabpanel" className="relative z-10 -mt-px">
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
            />
          )}
          {activeTab === "skills" && (
            <section className="min-h-[32rem] rounded-b-[27px] rounded-t-none border border-border bg-card p-5 shadow-sm sm:p-7">
              <p className="text-lg text-muted-foreground">Perícias e testes do personagem.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
