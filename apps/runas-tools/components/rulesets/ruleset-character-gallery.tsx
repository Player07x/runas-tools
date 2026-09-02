"use client"

import { CharacterGallery } from "@/components/gallery/character-gallery"
import { CronosCharacterGallery } from "@/components/cronos/cronos-character-gallery"
import { useRuleset } from "./ruleset-provider"

export function RulesetCharacterGallery() {
  const { activeRulesetId } = useRuleset()
  return activeRulesetId === "cronos" ? <CronosCharacterGallery /> : <CharacterGallery />
}
