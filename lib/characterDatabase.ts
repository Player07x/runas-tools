import type { Character } from "@/types/character"
import { CHARACTER_VERSION } from "@/types/character"
import { loadCharacter, normalizeCharacter, saveCharacter } from "@/lib/characterStorage"

const DATABASE_NAME = "runas-tools"
const DATABASE_VERSION = 1
const SECTION_STORE = "character-sections"

interface StoredSection {
  key: string
  value: unknown
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Falha no IndexedDB."))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error("Transação cancelada."))
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao salvar a ficha."))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB indisponível."))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(SECTION_STORE)) {
        database.createObjectStore(SECTION_STORE, { keyPath: "key" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o IndexedDB."))
  })
}

function characterSections(character: Character): StoredSection[] {
  return [
    { key: "metadata", value: { version: CHARACTER_VERSION, name: character.name } },
    { key: "info", value: character.info },
    { key: "attributes", value: character.attributes },
    { key: "stats", value: character.stats },
    { key: "skills", value: character.skills },
    { key: "bonds", value: character.bonds },
    { key: "abilities", value: character.abilities },
    { key: "notes", value: character.notes },
  ]
}

async function readIndexedCharacter(): Promise<Character | null> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(SECTION_STORE, "readonly")
    const records = await requestResult(transaction.objectStore(SECTION_STORE).getAll()) as StoredSection[]
    if (records.length === 0) return null
    const sections = new Map(records.map((record) => [record.key, record.value]))
    const metadata = sections.get("metadata") as { version?: number; name?: string } | undefined
    if (!metadata) return null
    return normalizeCharacter({
      version: metadata.version,
      name: metadata.name,
      info: sections.get("info") as Character["info"],
      attributes: sections.get("attributes") as Character["attributes"],
      stats: sections.get("stats") as Character["stats"],
      skills: sections.get("skills") as Character["skills"],
      bonds: sections.get("bonds") as Character["bonds"],
      abilities: sections.get("abilities") as Character["abilities"],
      notes: sections.get("notes") as Character["notes"],
    })
  } finally {
    database.close()
  }
}

async function writeIndexedCharacter(character: Character): Promise<void> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(SECTION_STORE, "readwrite")
    const store = transaction.objectStore(SECTION_STORE)
    characterSections(character).forEach((section) => store.put(section))
    await transactionComplete(transaction)
  } finally {
    database.close()
  }
}

/**
 * Carrega a ficha seccionada do IndexedDB. Na primeira execução, copia a
 * ficha legada do localStorage sem apagá-la, preservando um fallback seguro.
 */
export async function loadCharacterDatabase(): Promise<Character | null> {
  try {
    const indexedCharacter = await readIndexedCharacter()
    if (indexedCharacter) return indexedCharacter
    const legacyCharacter = loadCharacter()
    if (legacyCharacter) await writeIndexedCharacter(legacyCharacter)
    return legacyCharacter
  } catch {
    return loadCharacter()
  }
}

/** Salva cada seção da ficha em um registro independente do IndexedDB. */
export async function saveCharacterDatabase(character: Character): Promise<void> {
  try {
    await writeIndexedCharacter(character)
  } catch {
    saveCharacter(character)
  }
}
