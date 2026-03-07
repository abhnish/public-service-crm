import React, { useState, useEffect } from 'react';
import { Department } from '../services/api';
import api from '../services/api';

interface MapFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: string;
    dateTo?: string;
    departmentIds?: number[];
    status?: string;
    minPriority?: number;
  }) => void;
}

const MapFilters: React.FC<MapFiltersProps> = ({ onFiltersChange }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [status, setStatus] = useState('');
  const [minPriority, setMinPriority] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    // Load departments
    const fetchData = async () => {
      try {
        const departmentsResponse = await api.get('/utility/departments');
        setDepartments(departmentsResponse.data);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Notify parent of filter changes
    const filters: any = {};
    
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (selectedDepartments.length > 0) filters.departmentIds = selectedDepartments;
    if (status) filters.status = status;
    if (minPriority > 0) filters.minPriority = minPriority;

    onFiltersChange(filters);
  }, [dateFrom, dateTo, selectedDepartments, status, minPriority, onFiltersChange]);

  // const handleDepartmentToggle = (deptId: number) => {
  //   setSelectedDepartments(prev => 
  //     prev.includes(deptId) 
  //       ? prev.filter(id => id !== deptId)
  //       : [...prev, deptId]
  //   );
  // };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDepartments([]);
    setStatus('');
    setMinPriority(0);
  };

  const getPriorityColor = (value: number) => {
    if (value >= 8) return 'text-red-600';
    if (value >= 6) return 'text-orange-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Department Multi-Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departments ({selectedDepartments.length})
          </label>
          <div className="relative">
            <select
              multiple
              value={selectedDepartments.map(String)}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                setSelectedDepartments(values);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>

        {/* Priority Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Priority: <span className={getPriorityColor(minPriority)}>{minPriority}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={minPriority}
            onChange={(e) => setMinPriority(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex flex-wrap gap-2">
          {dateFrom && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              From: {new Date(dateFrom).toLocaleDateString()}
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              To: {new Date(dateTo).toLocaleDateString()}
            </span>
          )}
          {status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {status.replace('_', ' ')}
            </span>
          )}
          {selectedDepartments.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {selectedDepartments.length} Department{selectedDepartments.length > 1 ? 's' : ''}
            </span>
          )}
          {minPriority > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Priority ≥ {minPriority}
            </span>
          )}
          {!dateFrom && !dateTo && !status && selectedDepartments.length === 0 && minPriority === 0 && (
            <span className="text-gray-500 text-sm">No filters applied</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
