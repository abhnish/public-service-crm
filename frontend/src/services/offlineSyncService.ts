import { offlineDraftService, ComplaintDraft } from './offlineDraftService';
import api from './api';

class OfflineSyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  // private retryDelay: number = 5000; // 5 seconds
  private maxRetries: number = 3;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  // Get current online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Subscribe to online status changes
  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners of status change
  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }

  // Handle coming online
  private handleOnline(): void {
    console.log('Device is online - starting sync');
    this.isOnline = true;
    this.notifyListeners(true);
    this.syncOutbox();
  }

  // Handle going offline
  private handleOffline(): void {
    console.log('Device is offline - stopping sync');
    this.isOnline = false;
    this.notifyListeners(false);
  }

  // Sync all items in outbox
  async syncOutbox(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting outbox sync...');

    try {
      const outboxItems = await offlineDraftService.getOutboxItems();
      
      for (const item of outboxItems) {
        if (item.retryCount >= this.maxRetries) {
          console.warn(`Max retries exceeded for item ${item.id}, skipping`);
          continue;
        }

        try {
          await this.uploadComplaint(item);
          if (item.id) {
            await offlineDraftService.removeFromOutbox(item.id);
          }
          console.log(`Successfully uploaded complaint ${item.id}`);
        } catch (error) {
          console.error(`Failed to upload complaint ${item.id}:`, error);
          
          const newRetryCount = item.retryCount + 1;
          await offlineDraftService.updateRetryCount(
            item.id || '', 
            newRetryCount, 
            error instanceof Error ? error.message : 'Unknown error'
          );

          // If this is the last retry, wait before trying next item
          if (newRetryCount >= this.maxRetries) {
            console.warn(`Max retries reached for item ${item.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
      console.log('Outbox sync completed');
    }
  }

  // Upload a single complaint
  private async uploadComplaint(complaint: ComplaintDraft & { retryCount: number }): Promise<any> {
    const complaintData = {
      description: complaint.description,
      location: complaint.location,
      category: complaint.category,
      priorityScore: complaint.priorityScore,
      citizenId: complaint.citizenId,
      wardId: complaint.wardId,
      departmentId: complaint.departmentId,
    };

    const response = await api.post('/complaints', complaintData);
    return response.data;
  }

  // Save complaint to outbox when offline
  async saveComplaintOffline(complaintData: Partial<ComplaintDraft>): Promise<string> {
    try {
      // Try to submit immediately if online
      if (this.isOnline) {
        try {
          await this.uploadComplaint(complaintData as ComplaintDraft & { retryCount: number });
          return 'uploaded_immediately';
        } catch (error) {
          console.log('Immediate upload failed, saving to outbox:', error);
          // Fall through to save to outbox
        }
      }

      // Save to outbox for later upload
      const outboxId = await offlineDraftService.saveToOutbox(complaintData);
      console.log('Complaint saved to outbox for later upload:', outboxId);
      
      // Trigger sync if online
      if (this.isOnline) {
        setTimeout(() => this.syncOutbox(), 1000);
      }

      return outboxId;
    } catch (error) {
      console.error('Error saving complaint offline:', error);
      throw error;
    }
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    outboxCount: Promise<number>;
  } {
    const outboxCount = offlineDraftService.getOutboxItems().then(items => items.length);
    
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      outboxCount
    };
  }

  // Manual sync trigger
  async triggerManualSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOutbox();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Get failed uploads (items that exceeded max retries)
  async getFailedUploads(): Promise<(ComplaintDraft & { retryCount: number })[]> {
    const outboxItems = await offlineDraftService.getOutboxItems();
    return outboxItems.filter(item => item.retryCount >= this.maxRetries);
  }

  // Retry failed uploads
  async retryFailedUploads(): Promise<void> {
    const failedItems = await this.getFailedUploads();
    
    for (const item of failedItems) {
      // Reset retry count
      if (item.id) {
        await offlineDraftService.updateRetryCount(item.id, 0);
      }
    }

    // Trigger sync
    if (this.isOnline) {
      await this.syncOutbox();
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
