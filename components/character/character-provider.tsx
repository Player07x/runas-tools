"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { Character, CharacterGalleryEntry } from "@/types/character"
import { createEmptyCharacter } from "@/lib/characterStorage"
import { loadCharacterDatabase, loadCharacterGalleryDatabase, saveCharacterDatabase, saveCharacterGalleryDatabase } from "@/lib/characterDatabase"

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
  /** Indica se a ficha já foi hidratada do armazenamento local. */
  isReady: boolean
  galleryEntries: CharacterGalleryEntry[]
  activeGalleryId: string | null
  saveCurrentToGallery: () => boolean
  createGalleryCharacter: () => boolean
  importGalleryCharacter: (character: Character) => boolean
  importGalleryCharacters: (characters: Character[]) => number
  useGalleryCharacter: (id: string) => void
  deleteGalleryCharacter: (id: string) => void
}

const CharacterContext = createContext<CharacterContextValue | null>(null)

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [character, setCharacter] = useState<Character>(() => createEmptyCharacter())
  const [isReady, setIsReady] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [storedGalleryEntries, setStoredGalleryEntries] = useState<CharacterGalleryEntry[]>([])
  const [activeGalleryId, setActiveGalleryId] = useState<string | null>(null)
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const galleryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hidrata a ficha do IndexedDB e migra automaticamente o formato legado.
  useEffect(() => {
    let active = true
    void Promise.all([loadCharacterDatabase(), loadCharacterGalleryDatabase()]).then(([stored, gallery]) => {
      if (!active) return
      let entries = gallery.entries
      let activeId = gallery.activeId
      if (entries.length === 0 && stored) {
        activeId = crypto.randomUUID()
        entries = [{ id: activeId, character: stored, updatedAt: Date.now() }]
      }
      const activeEntry = entries.find((entry) => entry.id === activeId)
      const loadedCharacter = stored ?? activeEntry?.character ?? createEmptyCharacter()
      setCharacter(loadedCharacter)
      setStoredGalleryEntries(entries.map((entry) => entry.id === activeId ? { ...entry, character: loadedCharacter } : entry))
      setActiveGalleryId(activeId)
      setIsReady(true)
    })
    return () => { active = false }
  }, [])

  // Autosave com debounce: agrupa edições rápidas em uma única transação.
  useEffect(() => {
    if (!isReady) return
    setSaveStatus("saving")
    if (savedTimeout.current) clearTimeout(savedTimeout.current)
    const saveTimeout = setTimeout(() => {
      void saveCharacterDatabase(character).then(() => setSaveStatus("saved"))
    }, 300)
    savedTimeout.current = saveTimeout
    return () => clearTimeout(saveTimeout)
  }, [character, isReady])

  useEffect(() => {
    if (!isReady || !activeGalleryId) return
    setStoredGalleryEntries((current) => current.map((entry) => entry.id === activeGalleryId
      ? { ...entry, character, updatedAt: Date.now() }
      : entry))
  }, [activeGalleryId, character, isReady])

  const galleryEntries = storedGalleryEntries

  useEffect(() => {
    if (!isReady) return
    if (galleryTimeout.current) clearTimeout(galleryTimeout.current)
    const timeout = setTimeout(() => {
      void saveCharacterGalleryDatabase({ activeId: activeGalleryId, entries: galleryEntries })
    }, 350)
    galleryTimeout.current = timeout
    return () => clearTimeout(timeout)
  }, [activeGalleryId, galleryEntries, isReady])

  const updateCharacter = useCallback((updater: (prev: Character) => Character) => {
    setCharacter((prev) => updater(prev))
  }, [])

  const replaceCharacter = useCallback((next: Character) => {
    setCharacter(next)
  }, [])

  const resetCharacter = useCallback(() => {
    setCharacter(createEmptyCharacter())
  }, [])

  const saveCurrentToGallery = useCallback(() => {
    if (galleryEntries.length >= 20) return false
    const id = crypto.randomUUID()
    setStoredGalleryEntries((current) => [...current, { id, character, updatedAt: Date.now() }])
    setActiveGalleryId(id)
    return true
  }, [character, galleryEntries.length])

  const createGalleryCharacter = useCallback(() => {
    if (galleryEntries.length >= 20) return false
    const id = crypto.randomUUID()
    const next = createEmptyCharacter()
    setStoredGalleryEntries((current) => [
      ...current.map((entry) => entry.id === activeGalleryId ? { ...entry, character, updatedAt: Date.now() } : entry),
      { id, character: next, updatedAt: Date.now() },
    ])
    setActiveGalleryId(id)
    setCharacter(next)
    return true
  }, [activeGalleryId, character, galleryEntries.length])

  const importGalleryCharacter = useCallback((imported: Character) => {
    if (galleryEntries.length >= 20) return false
    const id = crypto.randomUUID()
    setStoredGalleryEntries((current) => [...current, { id, character: imported, updatedAt: Date.now() }])
    return true
  }, [galleryEntries.length])

  const importGalleryCharacters = useCallback((imported: Character[]) => {
    const accepted = imported.slice(0, Math.max(0, 20 - galleryEntries.length))
    if (accepted.length === 0) return 0
    const updatedAt = Date.now()
    setStoredGalleryEntries((current) => [
      ...current,
      ...accepted.map((nextCharacter) => ({ id: crypto.randomUUID(), character: nextCharacter, updatedAt })),
    ])
    return accepted.length
  }, [galleryEntries.length])

  const useGalleryCharacter = useCallback((id: string) => {
    const entry = galleryEntries.find((candidate) => candidate.id === id)
    if (!entry) return
    setStoredGalleryEntries((current) => current.map((candidate) => candidate.id === activeGalleryId
      ? { ...candidate, character, updatedAt: Date.now() }
      : candidate))
    setActiveGalleryId(id)
    setCharacter(entry.character)
  }, [activeGalleryId, character, galleryEntries])

  const deleteGalleryCharacter = useCallback((id: string) => {
    setStoredGalleryEntries((current) => current.filter((entry) => entry.id !== id))
    setActiveGalleryId((current) => current === id ? null : current)
  }, [])

  return (
    <CharacterContext.Provider
      value={{ character, updateCharacter, replaceCharacter, resetCharacter, saveStatus, isReady, galleryEntries, activeGalleryId, saveCurrentToGallery, createGalleryCharacter, importGalleryCharacter, importGalleryCharacters, useGalleryCharacter, deleteGalleryCharacter }}
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
