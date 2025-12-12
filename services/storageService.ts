import { SavedSnapshot } from '../types';

const DB_NAME = 'OmniDashDB';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initPromise = null;
        resolve();
      };

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('originalUrl', 'originalUrl', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async saveSnapshot(snapshot: SavedSnapshot): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(snapshot);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getAllSnapshots(): Promise<SavedSnapshot[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const results = request.result as SavedSnapshot[];
          results.sort((a, b) => b.savedAt - a.savedAt);
          resolve(results);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async getSnapshot(id: string): Promise<SavedSnapshot | undefined> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      } catch (e) {
        reject(e);
      }
    });
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('Database not initialized');
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const storageService = new StorageService();