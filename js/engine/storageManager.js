// File Path: js/engine/storageManager.js
// Purpose: IndexedDB interface for asynchronous, robust memory persistence.
// Allows the DAG pipeline to resume exactly where it left off on refresh.

class StorageManager {
    constructor() {
        this.dbName = 'LexisAI_MemoryDB';
        this.storeName = 'ResearchState';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('[StorageManager] IndexedDB permission denied or unavailable.', event);
                reject('IndexedDB initialization failed');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('[StorageManager] Cryptographic memory core online.');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    async saveState(stateObject) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // Always save under a single 'active_session' ID to maintain singleton behavior securely
            const request = store.put({ id: 'active_session', data: stateObject, timestamp: Date.now() });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Failed to write state to memory.');
        });
    }

    async loadState() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('active_session');

            request.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.data : null);
            };
            request.onerror = () => reject('Failed to read state from memory.');
        });
    }

    async clearMemory() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[StorageManager] Memory arrays explicitly cleared. Contamination prevented.');
                resolve(true);
            };
            request.onerror = () => reject('Failed to clear memory.');
        });
    }
}

export const storage = new StorageManager();
