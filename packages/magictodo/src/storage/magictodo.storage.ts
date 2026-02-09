/**
 * magictodo domain storage adapters.
 * Handles IndexedDB and localStorage operations for offline support.
 */

const STORAGE_PREFIX = "magictodo:";

// localStorage adapter
export const magictodoLocalStorage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Silently fail — localStorage write failures are non-critical
      // (quota exceeded, private browsing, etc.)
    }
  },
  
  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  },
  
  clear(): void {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// IndexedDB adapter (stub - customize as needed)
export const magictodoIndexedDB = {
  DB_NAME: "magictodo-db",
  DB_VERSION: 1,
  
  async open(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create object stores here
        if (!db.objectStoreNames.contains("items")) {
          db.createObjectStore("items", { keyPath: "id" });
        }
      };
    });
  },
};
