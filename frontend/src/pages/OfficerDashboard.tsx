import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Complaint } from '../services/api';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [assignedComplaints, setAssignedComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const fetchAssignedComplaints = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call when available
      const mockComplaints: Complaint[] = [
        {
          id: 1,
          category: 'Water Supply',
          description: 'Low water pressure affecting 50+ households in Sector 12',
          status: 'in_progress',
          priorityScore: 0.9,
          sentiment: 'neutral',
          createdAt: '2024-03-15T10:30:00Z',
          assignedAt: '2024-03-15T11:00:00Z',
          location: 'Sector 12, Residential Area',
          wardId: 1,
          departmentId: 1,
          assignedOfficer: user?.id,
          citizenId: 1
        },
        {
          id: 2,
          category: 'Street Light',
          description: 'Multiple lights not working on Main Road causing safety concerns',
          status: 'submitted',
          priorityScore: 0.7,
          sentiment: 'angry',
          createdAt: '2024-03-14T09:15:00Z',
          assignedAt: '2024-03-14T10:30:00Z',
          location: 'Main Road, Commercial Area',
          wardId: 2,
          departmentId: 2,
          assignedOfficer: user?.id,
          citizenId: 2
        },
        {
          id: 3,
          category: 'Sanitation',
          description: 'Garbage collection delayed for past 3 days in residential complex',
          status: 'in_progress',
          priorityScore: 0.8,
          sentiment: 'angry',
          createdAt: '2024-03-13T14:20:00Z',
          assignedAt: '2024-03-13T15:00:00Z',
          location: 'Green Valley Apartments',
          wardId: 3,
          departmentId: 3,
          assignedOfficer: user?.id,
          citizenId: 3
        }
      ];

      // Sort by priorityScore descending
      const sortedComplaints = mockComplaints.sort((a, b) => b.priorityScore - a.priorityScore);
      setAssignedComplaints(sortedComplaints);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch assigned complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: number, newStatus: string) => {
    try {
      setUpdatingId(complaintId);
      
      // Mock API call - replace with actual API call when available
      // await complaintsAPI.update(complaintId, { status: newStatus });
      
      // Update local state
      setAssignedComplaints(prev => 
        prev.map(complaint => 
          complaint.id === complaintId 
            ? { ...complaint, status: newStatus as any, resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined }
            : complaint
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update complaint status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-slate-800 text-slate-300 border border-slate-700';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 0.8) return 'text-rose-400';
    if (score >= 0.5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const assignedCount = assignedComplaints.length;
  const resolvedCount = assignedComplaints.filter(c => c.status === 'resolved').length;
  const inProgressCount = assignedComplaints.filter(c => c.status === 'in_progress').length;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-12 font-sans selection:bg-cyan-500/30">
      <h2 className="text-slate-50 text-3xl font-bold tracking-tight mb-8">Officer Dashboard</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
          {error}
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 hover:border-cyan-500/40 transition-all duration-300 group">
          <h3 className="text-cyan-400 text-sm uppercase tracking-wider font-semibold">Assigned</h3>
          <p className="text-4xl font-bold text-slate-50 mt-3 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all">{assignedCount}</p>
          <p className="text-sm text-slate-400 mt-1">Active complaints</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 hover:border-amber-500/40 transition-all duration-300 group">
          <h3 className="text-amber-400 text-sm uppercase tracking-wider font-semibold">In Progress</h3>
          <p className="text-4xl font-bold text-slate-50 mt-3 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] transition-all">{inProgressCount}</p>
          <p className="text-sm text-slate-400 mt-1">Currently working on</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 hover:border-emerald-500/40 transition-all duration-300 group">
          <h3 className="text-emerald-400 text-sm uppercase tracking-wider font-semibold">Resolved</h3>
          <p className="text-4xl font-bold text-slate-50 mt-3 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-all">{resolvedCount}</p>
          <p className="text-sm text-slate-400 mt-1">Successfully closed</p>
        </div>
      </div>
      
      {/* Assigned Complaints */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-3xl mt-8 shadow-2xl">
        <h3 className="text-slate-50 text-xl font-bold mb-6">My Assigned Complaints</h3>
        {assignedComplaints.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-700/50 rounded-xl">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-slate-400 text-lg font-medium">No complaints assigned to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 mb-4 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 group shadow-sm hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="text-slate-50 text-lg font-bold group-hover:text-cyan-400 transition-colors">{complaint.category}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-950/50 border border-slate-800 flex items-center gap-1 min-w-max ${getPriorityColor(complaint.priorityScore)}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Priority {(complaint.priorityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-slate-400 mb-3 text-sm leading-relaxed">{complaint.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
                        <span className="text-slate-400">ID:</span> #{complaint.id}
                      </span>
                      {complaint.location && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                            {complaint.location}
                          </span>
                        </>
                       )}
                      <span className="text-slate-700">•</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Assigned: {formatDate(complaint.assignedAt!)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    {complaint.status === 'submitted' && (
                      <button
                        onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                        disabled={updatingId === complaint.id}
                        className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {updatingId === complaint.id ? (
                          <><div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></div> Updating</>
                        ) : 'Start Work'}
                      </button>
                    )}
                    
                    {complaint.status === 'in_progress' && (
                      <button
                        onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        disabled={updatingId === complaint.id}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {updatingId === complaint.id ? (
                          <><div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></div> Updating</>
                        ) : 'Mark Resolved'}
                      </button>
                    )}
                    
                    {complaint.status === 'resolved' && (
                      <span className="w-full sm:w-auto bg-slate-800 text-slate-500 border border-slate-700 px-5 py-2.5 rounded-lg cursor-not-allowed flex items-center justify-center font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;
