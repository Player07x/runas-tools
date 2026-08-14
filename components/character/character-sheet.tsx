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
    return <p className="px-4 py-8 text-sm text-[#acbfd1]">Carregando ficha…</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-[27px] bg-[#4c587b] px-5 py-4 sm:px-7">
        <SaveIndicator />
        <CharacterActions />
      </section>

      <div>
        <div className="grid grid-cols-2 gap-x-1 sm:grid-cols-4">
          {unavailableTabs.map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title="Ainda não disponível"
              className="h-12 rounded-t-[27px] bg-[#313a53] px-2 text-base font-bold text-[#b6b2b2] disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-1 sm:grid-cols-4">
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
                  "h-12 rounded-t-[27px] px-2 text-base font-bold transition-colors",
                  isActive ? "bg-[#4c587b] text-white" : "bg-[#394362] text-[#d1c9c9] hover:bg-[#414c6e]",
                  !isAvailable && "cursor-not-allowed opacity-80 hover:bg-[#394362]",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div role="tabpanel">
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
            <section className="min-h-[32rem] rounded-[27px] bg-[#4c587b] p-5 sm:p-7">
              <p className="text-lg text-[#acbfd1]">Perícias e testes do personagem.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
