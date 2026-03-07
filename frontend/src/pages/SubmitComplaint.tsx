import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintsAPI, utilityAPI } from '../services/api';
import { Ward, Department } from '../services/api';

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

  React.useEffect(() => {
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
        // Use mock data if API fails
        setWards([
          { id: 1, name: 'Ward 1', geojson: {} },
          { id: 2, name: 'Ward 2', geojson: {} },
          { id: 3, name: 'Ward 3', geojson: {} }
        ]);
        setDepartments([
          { id: 1, name: 'Water', slaHours: 24 },
          { id: 2, name: 'Roads', slaHours: 48 },
          { id: 3, name: 'Sanitation', slaHours: 12 }
        ]);
      }
    };

    fetchData();
  }, []);

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

      const response = await complaintsAPI.create(complaintData);
      const { priorityScore } = response.data;

      setSuccess(`Complaint submitted successfully! Priority Score: ${priorityScore}`);
      
      // Reset form
      setDescription('');
      setWardId('');
      setDepartmentId('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setAttachment(null);

      // Redirect to complaints list after 2 seconds
      setTimeout(() => {
        navigate('/my-complaints');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  return (
    <div className="w-full h-full p-4 sm:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-3xl mx-auto mt-4 sm:mt-10 p-6 sm:p-10 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-slate-800 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight">Submit Complaint</h2>
          <p className="text-slate-400 mt-2 font-medium">Please provide details about the issue to initiate resolution</p>
        </div>
        
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Ward */}
          <div className="col-span-1">
            <label htmlFor="ward" className="block text-sm font-medium text-slate-400 mb-1.5">
              Ward <span className="text-cyan-400">*</span>
            </label>
            <select
              id="ward"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none sm:text-sm"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              required
            >
              <option value="" className="bg-slate-900 text-slate-400">Select a ward</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id} className="bg-slate-900 text-slate-50">
                  {ward.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="col-span-1">
            <label htmlFor="department" className="block text-sm font-medium text-slate-400 mb-1.5">
              Department <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none sm:text-sm"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="" className="bg-slate-900 text-slate-400">Select a department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id} className="bg-slate-900 text-slate-50">
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-400 mb-1.5">
              Description <span className="text-cyan-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none sm:text-sm"
              placeholder="Please describe your complaint in detail..."
              required
            />
          </div>

          {/* Address */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="location" className="block text-sm font-medium text-slate-400 mb-1.5">
              Address <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
              placeholder="Enter the address or location"
            />
          </div>

          {/* Latitude */}
          <div className="col-span-1">
            <label htmlFor="latitude" className="block text-sm font-medium text-slate-400 mb-1.5">
              Latitude <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              id="latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              step="any"
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
              placeholder="e.g. 40.7128"
            />
          </div>

          {/* Longitude */}
          <div className="col-span-1">
            <label htmlFor="longitude" className="block text-sm font-medium text-slate-400 mb-1.5">
              Longitude <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              id="longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              step="any"
              className="block w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all sm:text-sm"
              placeholder="e.g. -74.0060"
            />
          </div>

          {/* Attachment Dropzone */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="attachment" className="block text-sm font-medium text-slate-400 mb-1.5">
              Attachment <span className="text-slate-600 font-normal">(Optional)</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl p-8 text-center transition-colors group hover:border-cyan-500 cursor-pointer overflow-hidden">
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept="image/*,.pdf,.doc,.docx"
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm font-medium text-slate-300">
                  <span className="text-cyan-400">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-500">SVG, PNG, JPG, PDF or DOC (max. 10MB)</p>
              </div>
            </div>
            {attachment && (
              <div className="mt-4 flex items-center gap-3 text-sm text-cyan-400 bg-cyan-500/10 px-4 py-3 rounded-lg border border-cyan-500/20">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <span className="font-medium truncate flex-1">{attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="col-span-1 md:col-span-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-4 px-4 rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Submitting Report...
                </span>
              ) : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
