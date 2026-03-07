import React, { useState, useEffect } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';

interface OfflineBannerProps {
  onSyncStatusChange?: (status: { pending: number; syncing: boolean }) => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncStatusChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, syncing: false });
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  useEffect(() => {
    // Subscribe to online status changes
    const unsubscribe = offlineSyncService.subscribe((online) => {
      setIsOnline(online);
    });

    // Initial status
    setIsOnline(offlineSyncService.getOnlineStatus());

    // Update sync status periodically
    const updateSyncStatus = async () => {
      const status = offlineSyncService.getSyncStatus();
      const pending = await status.outboxCount;
      setSyncStatus({ pending, syncing: status.syncInProgress });
      onSyncStatusChange?.({ pending, syncing: status.syncInProgress });
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [onSyncStatusChange]);

  // Show success message when items are uploaded
  useEffect(() => {
    if (syncStatus.pending === 0 && !isOnline) {
      return;
    }

    const prevPending = syncStatus.pending;
    const checkInterval = setInterval(async () => {
      const status = offlineSyncService.getSyncStatus();
      const currentPending = await status.outboxCount;
      
      if (prevPending > 0 && currentPending === 0) {
        setShowUploadSuccess(true);
        setTimeout(() => setShowUploadSuccess(false), 3000);
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [syncStatus.pending, isOnline]);

  const handleManualSync = async () => {
    try {
      await offlineSyncService.triggerManualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  if (isOnline && syncStatus.pending === 0 && !showUploadSuccess) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-orange-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">You are offline</span>
            <span className="text-sm">— Drafts are being saved locally</span>
          </div>
          {syncStatus.pending > 0 && (
            <div className="mt-2 text-sm">
              {syncStatus.pending} complaint{syncStatus.pending > 1 ? 's' : ''} will be uploaded when you're back online
            </div>
          )}
        </div>
      )}

      {/* Syncing Banner */}
      {isOnline && syncStatus.syncing && (
        <div className="bg-blue-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-medium">Syncing complaints...</span>
          </div>
          {syncStatus.pending > 0 && (
            <div className="mt-2 text-sm">
              Uploading {syncStatus.pending} pending complaint{syncStatus.pending > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Pending Upload Banner */}
      {isOnline && !syncStatus.syncing && syncStatus.pending > 0 && (
        <div className="bg-yellow-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              {syncStatus.pending} complaint{syncStatus.pending > 1 ? 's' : ''} pending upload
            </span>
            <button
              onClick={handleManualSync}
              className="bg-white text-yellow-600 px-3 py-1 rounded text-sm font-medium hover:bg-yellow-50"
            >
              Upload Now
            </button>
          </div>
        </div>
      )}

      {/* Upload Success Banner */}
      {showUploadSuccess && (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Draft uploaded successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
