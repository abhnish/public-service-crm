import { useState, useEffect } from 'react';
import { complaintsAPI } from '../services/api';
import { Complaint } from '../services/api';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await complaintsAPI.getAll();
      setComplaints(response.data.complaints);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch complaints');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-slate-800 text-slate-300 border border-slate-600';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'resolved':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'closed':
        return 'bg-slate-800/50 text-slate-500 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedComplaint(null);
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 p-4 sm:p-8 font-sans">
        <div className="max-w-6xl mx-auto mt-4 sm:mt-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-slate-400 font-medium">Loading your submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 p-4 sm:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto mt-0 sm:mt-4 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">My Complaints</h2>
          <button
            onClick={() => window.location.href = '/submit-complaint'}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Submit New Complaint
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        {complaints.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-700/50 rounded-xl">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <p className="text-slate-400 text-lg font-medium">No complaints found</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">You haven't submitted any community issues yet.</p>
            <button
              onClick={() => window.location.href = '/submit-complaint'}
              className="bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold px-6 py-2 rounded-lg transition-all"
            >
              Submit Your First Complaint
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/80 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm hover:shadow-lg"
                onClick={() => openModal(complaint)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-slate-50 group-hover:text-cyan-400 transition-colors">{complaint.category}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 line-clamp-2 text-sm leading-relaxed">{complaint.description}</p>
                    <div className="flex flex-wrap items-center mt-3 gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 border border-slate-700">
                        <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Priority {complaint.priorityScore}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {formatDate(complaint.createdAt)}
                      </span>
                    </div>
                  </div>
                  {complaint.location && (
                    <div className="text-sm text-slate-400 flex items-start gap-1.5 sm:max-w-xs bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50">
                      <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="line-clamp-2 leading-tight">{complaint.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for complaint details */}
        {showModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-50">{selectedComplaint.category}</h3>
                    <p className="text-sm text-slate-500 mt-1">ID: #{selectedComplaint.id?.toString().padStart(6, '0')}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-50 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Status</h4>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedComplaint.status)}`}>
                        {getStatusText(selectedComplaint.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider mb-2">Description</h4>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                      <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider mb-2">System Priority</h4>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className={`w-full bg-slate-800 rounded-full h-2`}>
                            <div
                              className="bg-cyan-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              style={{ width: `${selectedComplaint.priorityScore * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-cyan-400">{selectedComplaint.priorityScore.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedComplaint.location && (
                      <div>
                        <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider mb-2">Location</h4>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-start gap-2 h-full">
                           <svg className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                          <p className="text-slate-400 text-sm leading-tight">{selectedComplaint.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-300 text-sm uppercase tracking-wider mb-4 border-t border-slate-800 pt-6">Resolution Timeline</h4>
                    <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                      
                      {/* Submitted Node */}
                      <div className="relative flex items-center gap-4">
                        <div className="absolute left-[-5px] w-3 h-3 bg-cyan-500 rounded-full ring-4 ring-slate-900 z-10 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        <div className="pl-6 flex-1">
                          <p className="text-sm font-bold text-slate-50">Report Submitted</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                        </div>
                      </div>

                      {/* Assigned Node */}
                      <div className="relative flex items-center gap-4">
                        <div className={`absolute left-[-5px] w-3 h-3 rounded-full ring-4 ring-slate-900 z-10 ${selectedComplaint.assignedAt ? 'bg-amber-400' : 'bg-slate-700'}`}></div>
                        <div className="pl-6 flex-1">
                          <p className={`text-sm font-bold ${selectedComplaint.assignedAt ? 'text-slate-50' : 'text-slate-600'}`}>Assigned to Official</p>
                          {selectedComplaint.assignedAt && (
                            <p className="text-xs text-amber-500 mt-0.5">{formatDate(selectedComplaint.assignedAt)}</p>
                          )}
                        </div>
                      </div>

                      {/* Resolved Node */}
                      <div className="relative flex items-center gap-4">
                        <div className={`absolute left-[-5px] w-3 h-3 rounded-full ring-4 ring-slate-900 z-10 ${selectedComplaint.resolvedAt ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
                        <div className="pl-6 flex-1">
                          <p className={`text-sm font-bold ${selectedComplaint.resolvedAt ? 'text-slate-50' : 'text-slate-600'}`}>Issue Resolved</p>
                          {selectedComplaint.resolvedAt && (
                            <p className="text-xs text-emerald-500 mt-0.5">{formatDate(selectedComplaint.resolvedAt)}</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
