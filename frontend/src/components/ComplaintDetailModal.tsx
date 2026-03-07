import React from 'react';

interface Complaint {
  id: number;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  status: string;
  priorityScore: number;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  wardId?: number;
  departmentId?: number;
  citizenId?: number;
  assignedOfficer?: number;
  attachments?: any;
}

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
}

const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ 
  complaint, 
  isOpen, 
  onClose 
}) => {
  if (!complaint || !isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.6) return 'text-orange-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
              <p className="text-sm text-gray-500">ID: #{complaint.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                {complaint.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Score</label>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${getPriorityColor(complaint.priorityScore)}`}>
                  {(complaint.priorityScore * 10).toFixed(1)}
                </span>
                <span className="ml-2 text-sm text-gray-500">/10</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{complaint.description}</p>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <p className="text-gray-800">{complaint.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-gray-800">{complaint.category}</p>
            </div>
          </div>

          {/* Coordinates */}
          {(complaint.latitude && complaint.longitude) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <p className="text-gray-800">{complaint.latitude.toFixed(6)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <p className="text-gray-800">{complaint.longitude.toFixed(6)}</p>
              </div>
            </div>
          )}

          {/* IDs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ward ID</label>
              <p className="text-gray-800">{complaint.wardId || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department ID</label>
              <p className="text-gray-800">{complaint.departmentId || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Officer</label>
              <p className="text-gray-800">{complaint.assignedOfficer || 'N/A'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
              <p className="text-gray-800">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
            {complaint.assignedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned</label>
                <p className="text-gray-800">
                  {new Date(complaint.assignedAt).toLocaleString()}
                </p>
              </div>
            )}
            {complaint.resolvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolved</label>
                <p className="text-gray-800">
                  {new Date(complaint.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Resolution Time */}
          {complaint.assignedAt && complaint.resolvedAt && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Time</label>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  {Math.round(
                    (new Date(complaint.resolvedAt).getTime() - 
                    new Date(complaint.assignedAt).getTime()) / (1000 * 60 * 60)
                  )} hours
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
            {complaint.latitude && complaint.longitude && (
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`,
                    '_blank'
                  );
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View on Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailModal;
