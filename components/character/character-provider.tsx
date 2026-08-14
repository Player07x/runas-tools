"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { Character } from "@/types/character"
import { createEmptyCharacter, loadCharacter, saveCharacter } from "@/lib/characterStorage"

type SaveStatus = "idle" | "saving" | "saved"

interface CharacterContextValue {
  character: Character
  /** Atualiza a ficha via updater imutável. */
  updateCharacter: (updater: (prev: Character) => Character) => void
  /** Substitui a ficha inteira (ex: importação). */
  replaceCharacter: (next: Character) => void
  /** Reseta para uma ficha em branco. */
  resetCharacter: () => void
  saveStatus: SaveStatus
  /** Indica se a ficha já foi hidratada do localStorage. */
  isReady: boolean
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<Character>(() => createEmptyCharacter())
  const [isReady, setIsReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hidrata a ficha a partir do localStorage no primeiro render do cliente.
  useEffect(() => {
    const stored = loadCharacter()
    if (stored) setCharacter(stored)
    setIsReady(true)
  }, [])

  // Autosave: persiste toda alteração após a hidratação.
  useEffect(() => {
    if (!isReady) return
    setSaveStatus("saving")
    saveCharacter(character)
    if (savedTimeout.current) clearTimeout(savedTimeout.current)
    const showSaved = setTimeout(() => setSaveStatus("saved"), 250)
    savedTimeout.current = showSaved
    return () => clearTimeout(showSaved)
  }, [character, isReady])

  const updateCharacter = useCallback((updater: (prev: Character) => Character) => {
    setCharacter((prev) => updater(prev))
  }, [])

  const replaceCharacter = useCallback((next: Character) => {
    setCharacter(next)
  }, [])

  const resetCharacter = useCallback(() => {
    setCharacter(createEmptyCharacter())
  }, [])

  return (
    <CharacterContext.Provider
      value={{ character, updateCharacter, replaceCharacter, resetCharacter, saveStatus, isReady }}
    >
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext)
  if (!ctx) throw new Error("useCharacter deve ser usado dentro de <CharacterProvider>")
  return ctx
}
