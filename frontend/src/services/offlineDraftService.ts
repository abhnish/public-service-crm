// IndexedDB service for offline complaint drafts

interface ComplaintDraft {
  id?: string;
  description: string;
  location: string;
  category: string;
  priorityScore: number;
  citizenId?: number;
  wardId?: number;
  departmentId?: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending_upload' | 'uploaded';
  errorMessage?: string;
}

class OfflineDraftService {
  private dbName = 'SmartCRMOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('status', 'status', { unique: false });
          draftsStore.createIndex('createdAt', 'createdAt', { unique: false });
          draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create outbox store for pending uploads
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
          outboxStore.createIndex('retryCount', 'retryCount', { unique: false });
        }
      };
    });
  }

  // Save or update a draft
  async saveDraft(draft: Partial<ComplaintDraft>): Promise<string> {
    if (!this.db) await this.init();

    const id = draft.id || this.generateId();
    const now = new Date().toISOString();
    
    const fullDraft: ComplaintDraft = {
      description: draft.description || '',
      location: draft.location || '',
      category: draft.category || '',
      priorityScore: draft.priorityScore || 0.5,
      citizenId: draft.citizenId,
      wardId: draft.wardId,
      departmentId: draft.departmentId,
      id,
      createdAt: draft.createdAt || now,
      updatedAt: now,
      status: 'draft'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(fullDraft);

      request.onsuccess = () => {
        console.log('Draft saved successfully:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to save draft:', request.error);
        reject(request.error);
      };
    });
  }

  // Get a specific draft
  async getDraft(id: string): Promise<ComplaintDraft | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get draft:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all drafts
  async getAllDrafts(): Promise<ComplaintDraft[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get all drafts:', request.error);
        reject(request.error);
      };
    });
  }

  // Delete a draft
  async deleteDraft(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts'], 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Draft deleted successfully:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete draft:', request.error);
        reject(request.error);
      };
    });
  }

  // Save complaint to outbox for later upload
  async saveToOutbox(complaint: Partial<ComplaintDraft>): Promise<string> {
    if (!this.db) await this.init();

    const id = this.generateId();
    const now = new Date().toISOString();
    
    const outboxItem: ComplaintDraft & { retryCount: number } = {
      description: complaint.description || '',
      location: complaint.location || '',
      category: complaint.category || '',
      priorityScore: complaint.priorityScore || 0.5,
      citizenId: complaint.citizenId,
      wardId: complaint.wardId,
      departmentId: complaint.departmentId,
      id,
      createdAt: now,
      updatedAt: now,
      status: 'pending_upload',
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['outbox'], 'readwrite');
      const store = transaction.objectStore('outbox');
      const request = store.put(outboxItem);

      request.onsuccess = () => {
        console.log('Complaint saved to outbox:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to save to outbox:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all items from outbox
  async getOutboxItems(): Promise<(ComplaintDraft & { retryCount: number })[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['outbox'], 'readonly');
      const store = transaction.objectStore('outbox');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get outbox items:', request.error);
        reject(request.error);
      };
    });
  }

  // Remove item from outbox (after successful upload)
  async removeFromOutbox(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['outbox'], 'readwrite');
      const store = transaction.objectStore('outbox');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Item removed from outbox:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove from outbox:', request.error);
        reject(request.error);
      };
    });
  }

  // Update retry count for outbox item
  async updateRetryCount(id: string, retryCount: number, errorMessage?: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['outbox'], 'readwrite');
      const store = transaction.objectStore('outbox');
      
      // First get the existing item
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount = retryCount;
          item.updatedAt = new Date().toISOString();
          if (errorMessage) {
            item.errorMessage = errorMessage;
          }
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Item not found in outbox'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Generate unique ID
  private generateId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['drafts', 'outbox'], 'readwrite');
      
      Promise.all([
        new Promise<void>((res, rej) => {
          const req1 = transaction.objectStore('drafts').clear();
          req1.onsuccess = () => res();
          req1.onerror = () => rej(req1.error);
        }),
        new Promise<void>((res, rej) => {
          const req2 = transaction.objectStore('outbox').clear();
          req2.onsuccess = () => res();
          req2.onerror = () => rej(req2.error);
        })
      ]).then(() => {
        console.log('All offline data cleared');
        resolve();
      }).catch(reject);
    });
  }
}

export const offlineDraftService = new OfflineDraftService();
export type { ComplaintDraft };
