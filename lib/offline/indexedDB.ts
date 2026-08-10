import type { OfflineAction } from '@/lib/types'

const DB_NAME = 'ArogyaX_OfflineDB'
const DB_VERSION = 1
const STORE_NAME = 'action_queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'))
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveOfflineAction(action: OfflineAction): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(action)
    await new Promise((resolve) => (tx.oncomplete = resolve))
  } catch {
    // Fallback to localStorage if IndexedDB fails
    const raw = localStorage.getItem('arogyax_offline_queue') || '[]'
    const queue = JSON.parse(raw)
    queue.push(action)
    localStorage.setItem('arogyax_offline_queue', JSON.stringify(queue))
  }
}

export async function getOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch {
    const raw = localStorage.getItem('arogyax_offline_queue') || '[]'
    return JSON.parse(raw)
  }
}

export async function deleteOfflineAction(id: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    await new Promise((resolve) => (tx.oncomplete = resolve))
  } catch {
    const raw = localStorage.getItem('arogyax_offline_queue') || '[]'
    const queue: OfflineAction[] = JSON.parse(raw)
    localStorage.setItem(
      'arogyax_offline_queue',
      JSON.stringify(queue.filter((a) => a.id !== id))
    )
  }
}

export async function clearOfflineActions(): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    localStorage.removeItem('arogyax_offline_queue')
  } catch {
    localStorage.removeItem('arogyax_offline_queue')
  }
}
