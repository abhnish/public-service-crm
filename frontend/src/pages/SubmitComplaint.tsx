import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI, utilityAPI } from '../services/api';
import { Ward, Department } from '../services/api';
import { offlineDraftService } from '../services/offlineDraftService';
import { offlineSyncService } from '../services/offlineSyncService';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [wardId, setWardId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    // Fetch wards and departments on component mount
    const fetchData = async () => {
      try {
        const [wardsResponse, departmentsResponse] = await Promise.all([
          utilityAPI.getWards(),
          utilityAPI.getDepartments()
        ]);
        setWards(wardsResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load wards and departments. Please refresh the page.');
      }
    };

    // Load any existing draft
    const loadDraft = async () => {
      try {
        const drafts = await offlineDraftService.getAllDrafts();
        if (drafts.length > 0) {
          const latestDraft = drafts[0]; // Get the most recent draft
          setDescription(latestDraft.description);
          setWardId(latestDraft.wardId?.toString() || '');
          setDepartmentId(latestDraft.departmentId?.toString() || '');
          setLocation(latestDraft.location);
          setDraftId(latestDraft.id || null);
          setLastSaved(latestDraft.updatedAt);
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    };

    fetchData();
    loadDraft();

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!description.trim() && !wardId) return;

    const saveDraft = async () => {
      try {
        setIsDrafting(true);
        const draftData = {
          description: description.trim(),
          location: location.trim(),
          category: 'General', // Default category
          priorityScore: 0.5, // Default priority
          wardId: wardId ? parseInt(wardId) : undefined,
          departmentId: departmentId ? parseInt(departmentId) : undefined,
        };

        const id = await offlineDraftService.saveDraft(draftData);
        setDraftId(id);
        setLastSaved(new Date().toISOString());
        console.log('Draft auto-saved:', id);
      } catch (err) {
        console.error('Error auto-saving draft:', err);
      } finally {
        setIsDrafting(false);
      }
    };

    const interval = setInterval(saveDraft, 10000);
    return () => clearInterval(interval);
  }, [description, wardId, departmentId, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate required fields
    if (!description.trim()) {
      setError('Description is required');
      setIsLoading(false);
      return;
    }

    if (!wardId) {
      setError('Ward is required');
      setIsLoading(false);
      return;
    }

    try {
      const complaintData = {
        wardId: parseInt(wardId),
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        description: description.trim(),
        location: location.trim() || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        attachment: attachment || undefined
      };

      if (isOnline) {
        // Try to submit immediately if online
        const response = await complaintsAPI.create(complaintData);
        const { priorityScore } = response.data;

        setSuccess(`Complaint submitted successfully! Priority Score: ${priorityScore}`);
        
        // Clear draft after successful submission
        if (draftId) {
          await offlineDraftService.deleteDraft(draftId);
        }
        
        // Reset form
        resetForm();

        // Redirect to complaints list after 2 seconds
        setTimeout(() => {
          navigate('/my-complaints');
        }, 2000);
      } else {
        // Save to outbox if offline
        await offlineSyncService.saveComplaintOffline({
          description: complaintData.description,
          location: complaintData.location,
          category: 'General',
          priorityScore: 0.5,
          wardId: complaintData.wardId,
          departmentId: complaintData.departmentId,
        });

        setSuccess('Complaint saved locally. It will be uploaded when you\'re back online.');
        
        // Clear draft after saving to outbox
        if (draftId) {
          await offlineDraftService.deleteDraft(draftId);
        }
        
        // Reset form
        resetForm();

        // Redirect to complaints list after 2 seconds
        setTimeout(() => {
          navigate('/my-complaints');
        }, 2000);
      }

    } catch (err: any) {
      // If online submission fails, save to outbox
      if (navigator.onLine) {
        try {
          await offlineSyncService.saveComplaintOffline({
            description: description.trim(),
            location: location.trim(),
            category: 'General',
            priorityScore: 0.5,
            wardId: parseInt(wardId),
            departmentId: departmentId ? parseInt(departmentId) : undefined,
          });

          setSuccess('Complaint saved locally due to network issues. It will be uploaded automatically.');
          
          // Clear draft after saving to outbox
          if (draftId) {
            await offlineDraftService.deleteDraft(draftId);
          }
          
          // Reset form
          resetForm();

          setTimeout(() => {
            navigate('/my-complaints');
          }, 2000);
        } catch (offlineErr) {
          setError('Failed to submit complaint both online and offline. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setWardId('');
    setDepartmentId('');
    setLocation('');
    setLatitude('');
    setLongitude('');
    setAttachment(null);
    setDraftId(null);
    setLastSaved(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Submit Complaint</h2>
      
      {/* Draft Status Indicator */}
      {(draftId || isDrafting) && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          isDrafting ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
        }`}>
          <div className="flex items-center space-x-2">
            {isDrafting && (
              <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span>
              {isDrafting ? 'Saving draft...' : 'Draft saved locally'}
            </span>
          </div>
          {lastSaved && !isDrafting && (
            <div className="text-xs mt-1 opacity-75">
              Last saved: {new Date(lastSaved).toLocaleString()}
            </div>
          )}
        </div>
      )}
      
      {/* Online Status */}
      <div className={`mb-4 p-2 rounded text-sm text-center ${
        isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
      }`}>
        {isOnline ? '🟢 Online - Changes will be saved immediately' : '🟠 Offline - Changes saved locally'}
      </div>
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
            Ward *
          </label>
          <select
            id="ward"
            value={wardId}
            onChange={(e) => setWardId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a ward</option>
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department (Optional)
          </label>
          <select
            id="department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please describe your complaint in detail..."
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Address (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the address or location"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
              Latitude (Optional)
            </label>
            <input
              type="number"
              id="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="40.7128"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
              Longitude (Optional)
            </label>
            <input
              type="number"
              id="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              step="any"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="-74.0060"
            />
          </div>
        </div>

        <div>
          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
            Attachment (Optional)
          </label>
          <input
            type="file"
            id="attachment"
            onChange={handleFileChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            accept="image/*,.pdf,.doc,.docx"
          />
          {attachment && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {attachment.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
};

export default SubmitComplaint;
