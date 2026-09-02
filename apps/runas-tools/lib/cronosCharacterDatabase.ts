import type { CronosCharacter, CronosCharacterGallery } from "@runas/cronos-core/types/character"
import { normalizeCronosCharacter } from "@runas/cronos-core/lib/characterStorage"

const DATABASE_NAME = "runas-tools-cronos"
const DATABASE_VERSION = 1
const CHARACTER_STORE = "characters"
const ACTIVE_CHARACTER_KEY = "active-character"
const GALLERY_KEY = "character-gallery"
const FALLBACK_STORAGE_KEY = "runas.cronos.character.v1"

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Falha no IndexedDB de Cronos."))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("Falha ao salvar a ficha de Cronos."))
    transaction.onabort = () => reject(transaction.error ?? new Error("Gravação da ficha de Cronos cancelada."))
  })
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB indisponível."))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CHARACTER_STORE)) {
        request.result.createObjectStore(CHARACTER_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento de Cronos."))
  })
}

function loadFallback(): CronosCharacter | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY)
    return raw ? normalizeCronosCharacter(JSON.parse(raw) as CronosCharacter) : null
  } catch {
    return null
  }
}

export async function loadCronosCharacterDatabase(): Promise<CronosCharacter | null> {
  try {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(CHARACTER_STORE, "readonly")
      const stored = await requestResult(transaction.objectStore(CHARACTER_STORE).get(ACTIVE_CHARACTER_KEY)) as CronosCharacter | undefined
      return stored ? normalizeCronosCharacter(stored) : loadFallback()
    } finally {
      database.close()
    }
  } catch {
    return loadFallback()
  }
}

export async function saveCronosCharacterDatabase(character: CronosCharacter): Promise<void> {
  try {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(CHARACTER_STORE, "readwrite")
      transaction.objectStore(CHARACTER_STORE).put(character, ACTIVE_CHARACTER_KEY)
      await transactionComplete(transaction)
    } finally {
      database.close()
    }
  } catch {
    try {
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(character))
    } catch {
      // Mantém a ficha em memória quando o navegador não permite persistência.
    }
  }
}

export async function loadCronosCharacterGalleryDatabase(): Promise<CronosCharacterGallery> {
  try {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(CHARACTER_STORE, "readonly")
      const gallery = await requestResult(transaction.objectStore(CHARACTER_STORE).get(GALLERY_KEY)) as Partial<CronosCharacterGallery> | undefined
      const entries = Array.isArray(gallery?.entries) ? gallery.entries.slice(0, 100).map((entry) => ({ ...entry, character: normalizeCronosCharacter(entry.character), updatedAt: Number(entry.updatedAt) || Date.now() })) : []
      const activeId = typeof gallery?.activeId === "string" && entries.some((entry) => entry.id === gallery.activeId) ? gallery.activeId : null
      return { activeId, entries }
    } finally {
      database.close()
    }
  } catch {
    return { activeId: null, entries: [] }
  }
}

export async function saveCronosCharacterGalleryDatabase(gallery: CronosCharacterGallery): Promise<void> {
  try {
    const database = await openDatabase()
    try {
      const transaction = database.transaction(CHARACTER_STORE, "readwrite")
      transaction.objectStore(CHARACTER_STORE).put(gallery, GALLERY_KEY)
      await transactionComplete(transaction)
    } finally {
      database.close()
    }
  } catch {
    // A ficha ativa continua salva mesmo se a galeria não puder ser persistida.
  }
}
