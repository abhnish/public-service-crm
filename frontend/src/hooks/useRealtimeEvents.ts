import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { socketClient } from '../services/socketClient';
import { useToast } from '../components/ToastNotifications';

export const useRealtimeEvents = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Handle complaint created event
  const handleComplaintCreated = useCallback((data: { complaint: any; timestamp: string }) => {
    console.log('New complaint created:', data);
    
    // Show toast notification
    addToast({
      type: 'info',
      title: 'New Complaint Submitted',
      message: `Complaint #${data.complaint.id} has been submitted for ${data.complaint.location || 'unknown location'}`,
      duration: 5000,
    });

    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('complaint:created', { detail: data }));
  }, [addToast]);

  // Handle complaint assigned event
  const handleComplaintAssigned = useCallback((data: { complaint: any; officerId: number; timestamp: string }) => {
    console.log('Complaint assigned:', data);
    
    // Show toast notification
    addToast({
      type: 'info',
      title: 'Complaint Assigned',
      message: `Complaint #${data.complaint.id} has been assigned to an officer`,
      duration: 5000,
    });

    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('complaint:assigned', { detail: data }));
  }, [addToast]);

  // Handle complaint status updated event
  const handleComplaintStatusUpdated = useCallback((data: { complaint: any; oldStatus: string; newStatus: string; timestamp: string }) => {
    console.log('Complaint status updated:', data);
    
    // Show toast notification
    addToast({
      type: 'info',
      title: 'Complaint Status Updated',
      message: `Complaint #${data.complaint.id} status changed from ${data.oldStatus} to ${data.newStatus}`,
      duration: 5000,
    });

    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('complaint:status_updated', { detail: data }));
  }, [addToast]);

  // Handle complaint escalated event
  const handleComplaintEscalated = useCallback((data: { complaint: any; escalationReason: string; timestamp: string }) => {
    console.log('Complaint escalated:', data);
    
    // Show toast notification
    addToast({
      type: 'warning',
      title: 'Complaint Escalated',
      message: `Complaint #${data.complaint.id} has been escalated: ${data.escalationReason}`,
      duration: 8000,
    });

    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('complaint:escalated', { detail: data }));
  }, [addToast]);

  // Handle complaint resolved event
  const handleComplaintResolved = useCallback((data: { complaint: any; timestamp: string }) => {
    console.log('Complaint resolved:', data);
    
    // Show toast notification
    addToast({
      type: 'success',
      title: 'Complaint Resolved',
      message: `Complaint #${data.complaint.id} has been resolved successfully`,
      duration: 5000,
    });

    // Trigger custom event for components to listen to
    window.dispatchEvent(new CustomEvent('complaint:resolved', { detail: data }));
  }, [addToast]);

  useEffect(() => {
    if (!user || !socketClient.isConnected()) {
      return;
    }

    // Join role-based rooms
    socketClient.joinRoom(`role:${user.role}`);
    
    if (user.role === 'officer') {
      socketClient.joinRoom(`officer:${user.id}`);
    }

    // Set up Socket.IO event listeners
    socketClient.on('complaint.created', handleComplaintCreated);
    socketClient.on('complaint.assigned', handleComplaintAssigned);
    socketClient.on('complaint.status_updated', handleComplaintStatusUpdated);
    socketClient.on('complaint.escalated', handleComplaintEscalated);
    socketClient.on('complaint.resolved', handleComplaintResolved);

    // Cleanup function
    return () => {
      socketClient.off('complaint.created', handleComplaintCreated);
      socketClient.off('complaint.assigned', handleComplaintAssigned);
      socketClient.off('complaint.status_updated', handleComplaintStatusUpdated);
      socketClient.off('complaint.escalated', handleComplaintEscalated);
      socketClient.off('complaint.resolved', handleComplaintResolved);
    };
  }, [user, handleComplaintCreated, handleComplaintAssigned, handleComplaintStatusUpdated, handleComplaintEscalated, handleComplaintResolved]);

  // Return socket status for UI components
  const socketStatus = socketClient.getStatus();

  return {
    isConnected: socketStatus.connected,
    reconnectAttempts: socketStatus.reconnectAttempts,
    maxReconnectAttempts: socketStatus.maxReconnectAttempts,
  };
};
