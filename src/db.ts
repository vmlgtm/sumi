import { Note } from './types';

const DB_NAME = 'sumi_notes_db';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
const LOCAL_STORAGE_KEY = 'sumi_notes_fallback';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('pinned', 'pinned', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  async getAllNotes(): Promise<Note[]> {
    try {
      const db = await this.initDB();
      return new Promise<Note[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const notes: Note[] = request.result || [];
          resolve(notes);
        };

        request.onerror = () => reject(request.error);
      });
    } catch {
      // Fallback to localStorage
      return this.getFromLocalStorage();
    }
  }

  async saveNote(note: Note): Promise<void> {
    const cleanNote: Note = {
      id: String(note.id),
      title: typeof note.title === 'string' ? note.title : '',
      contentHtml: typeof note.contentHtml === 'string' ? note.contentHtml : '',
      pinned: Boolean(note.pinned),
      createdAt: typeof note.createdAt === 'number' ? note.createdAt : Date.now(),
      updatedAt: typeof note.updatedAt === 'number' ? note.updatedAt : Date.now(),
    };

    try {
      const db = await this.initDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(cleanNote);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Fallback to localStorage
      const notes = this.getFromLocalStorage();
      const index = notes.findIndex(n => n.id === cleanNote.id);
      if (index >= 0) {
        notes[index] = cleanNote;
      } else {
        notes.push(cleanNote);
      }
      this.saveToLocalStorage(notes);
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      const notes = this.getFromLocalStorage().filter(n => n.id !== id);
      this.saveToLocalStorage(notes);
    }
  }

  async bulkSaveNotes(notes: Note[]): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        notes.forEach(note => store.put(note));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch {
      this.saveToLocalStorage(notes);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  private getFromLocalStorage(): Note[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(notes: Note[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore if localStorage quota exceeded
    }
  }
}

export const storage = new StorageService();
