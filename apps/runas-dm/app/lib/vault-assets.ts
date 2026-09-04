const DATABASE_NAME = "runas-dm-vault-assets"
const STORE_NAME = "assets"
const DATABASE_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function cacheVaultAsset(path: string, content: Blob): Promise<void> {
  if (typeof indexedDB === "undefined" || !path.trim()) return
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put(content, path)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  }).finally(() => database.close())
}

export async function readCachedVaultAsset(path: string): Promise<Blob | null> {
  if (typeof indexedDB === "undefined" || !path.trim()) return null
  const database = await openDatabase()
  return new Promise<Blob | null>((resolve) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const request = transaction.objectStore(STORE_NAME).get(path)
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null)
    request.onerror = () => resolve(null)
    transaction.oncomplete = () => database.close()
  })
}
