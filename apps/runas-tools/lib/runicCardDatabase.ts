import { normalizeRunicCard, RUNIC_CARD_GALLERY_LIMIT, type RunicCard } from "@/lib/runicCards"

const DATABASE_NAME = "runas-tools"
const DATABASE_VERSION = 1
const STORE_NAME = "character-sections"
const GALLERY_KEY = "runic-card-gallery"

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "key" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir a galeria de cartas."))
  })
}

export async function loadRunicCardGallery(): Promise<RunicCard[]> {
  if (typeof indexedDB === "undefined") return []
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(GALLERY_KEY)
      request.onsuccess = () => {
        const cards = Array.isArray(request.result?.value) ? request.result.value : []
        resolve(cards.slice(0, RUNIC_CARD_GALLERY_LIMIT).flatMap((card: unknown) => {
          try { return [normalizeRunicCard(card)] } catch { return [] }
        }))
      }
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

export async function saveRunicCardGallery(cards: RunicCard[]): Promise<void> {
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite")
      transaction.objectStore(STORE_NAME).put({ key: GALLERY_KEY, value: cards.slice(0, RUNIC_CARD_GALLERY_LIMIT) })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}
