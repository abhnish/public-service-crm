import { useState, useEffect } from 'react';
import api, { complaintsAPI, Complaint } from '../services/api';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

interface Officer {
 id: number;
 fullName: string;
 email: string;
 departmentId: number;
 workload: number;
 assignedComplaints: { id: number; priorityScore: number; status: string; createdAt: string }[];
}

const ManageComplaints = () => {
 const [complaints, setComplaints] = useState<Complaint[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState('');
 const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned' | 'solved'>('unassigned');
 // Modal state
 const [assignModalOpen, setAssignModalOpen] = useState(false);
 const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
 const [officers, setOfficers] = useState<Officer[]>([]);
 const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
 const [assigningId, setAssigningId] = useState<number | null>(null);

 useRealtimeEvents();

 useEffect(() => {
 fetchComplaints();
 }, []);

 useEffect(() => {
 const handleStatusUpdate = (event: CustomEvent) => {
 const { complaint } = event.detail;
 setComplaints(prev => prev.map(c => c.id === complaint.id ? complaint : c));
 };

 window.addEventListener('complaint:status_updated', handleStatusUpdate as EventListener);
 window.addEventListener('complaint:updated', handleStatusUpdate as EventListener);

 return () => {
 window.removeEventListener('complaint:status_updated', handleStatusUpdate as EventListener);
 window.removeEventListener('complaint:updated', handleStatusUpdate as EventListener);
 };
 }, []);

 const fetchComplaints = async () => {
 try {
 setIsLoading(true);
 const response = await complaintsAPI.getAll({ limit: 1000 });
 setComplaints(response.data.complaints);
 } catch (err: any) {
 setError(err.response?.data?.error || 'Failed to fetch complaints');
 } finally {
 setIsLoading(false);
 }
 };

 const openAssignModal = async (complaint: Complaint) => {
 setSelectedComplaint(complaint);
 setAssignModalOpen(true);
 setIsLoadingOfficers(true);
 setOfficers([]);
 try {
 const targetDeptId = complaint.departmentId || '';
 const response = await api.get(`/officers${targetDeptId ? `?departmentId=${targetDeptId}` : ''}`);
 setOfficers(response.data);
 } catch (err) {
 console.error('Failed to load officers', err);
 } finally {
 setIsLoadingOfficers(false);
 }
 };

 const closeAssignModal = () => {
 setAssignModalOpen(false);
 setSelectedComplaint(null);
 };

 const handleAssign = async (officerId: number) => {
 if (!selectedComplaint) return;
 try {
 setAssigningId(officerId);
 await complaintsAPI.update(selectedComplaint.id, { assignedOfficer: officerId, status: 'submitted' });
 setComplaints(prev => prev.map(c => {
 if (c.id === selectedComplaint.id) {
 return { ...c, assignedOfficer: officerId, status: c.status !== 'in_progress' && c.status !== 'resolved' ? 'submitted' : c.status };
 }
 return c;
 }));
 closeAssignModal();
 } catch (err: any) {
 console.error('Failed to assign complaint', err);
 alert(err.response?.data?.error || 'Failed to assign complaint');
 } finally {
 setAssigningId(null);
 }
 };

 const unassigned = complaints.filter(c => !c.assignedOfficer && c.status !== 'resolved' && c.status !== 'closed');
 const assigned = complaints.filter(c => c.assignedOfficer && c.status !== 'resolved' && c.status !== 'closed');
 const solved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed');

 const activeComplaints = activeTab === 'unassigned' ? unassigned : activeTab === 'assigned' ? assigned : solved;

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'submitted':
 return <span className="px-2.5 py-1 text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full">Reported</span>;
 case 'in_progress':
 return <span className="px-2.5 py-1 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full">In Progress</span>;
 case 'resolved':
 return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full">Resolved</span>;
 case 'closed':
 return <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-full">Closed</span>;
 default:
 return <span className="px-2.5 py-1 text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded-full">{status}</span>;
 }
 };

 if (isLoading) {
 return (
 <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
 <div className="text-center py-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
 <p className="mt-4 text-slate-400 font-medium">Loading complaints...</p>
 </div>
 </div>
);
 }

 return (
 <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
 <div>
 <h1 className="text-3xl font-bold text-slate-50">Manage Complaints</h1>
 <p className="text-slate-300 mt-1">Assign, track, and monitor public complaints</p>
 </div>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm flex items-center gap-4">
 <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400">
 <svg className="w-6 h-6"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
 </svg>
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-400">Not Assigned</p>
 <p className="text-2xl font-bold text-slate-50">{unassigned.length}</p>
 </div>
 </div>
 <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm flex items-center gap-4">
 <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
 <svg className="w-6 h-6"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
 </svg>
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-400">Assigned (Pending)</p>
 <p className="text-2xl font-bold text-slate-50">{assigned.length}</p>
 </div>
 </div>

 <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm flex items-center gap-4">
 <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
 <svg className="w-6 h-6"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M5 13l4 4L19 7"/>
 </svg>
 </div>
 <div>
 <p className="text-sm font-semibold text-slate-400">Solved / Closed</p>
 <p className="text-2xl font-bold text-slate-50">{solved.length}</p>
 </div>
 </div>
 </div>

 {error && (
 <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-xl">
 <p className="text-red-700 dark:text-red-400">{error}</p>
 </div>
)}

 {/* Tabs */}
 <div className="flex space-x-1 p-1 bg-slate-800 rounded-xl mb-6 overflow-x-auto border border-slate-800">
 <button
 onClick={() => setActiveTab('unassigned')}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
 activeTab === 'unassigned'
 ? 'bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-800'
 : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800 '
 }`}
 >
 Not Assigned
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'unassigned' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-700 text-slate-300'}`}>
 {unassigned.length}
 </span>
 </button>
 <button
 onClick={() => setActiveTab('assigned')}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
 activeTab === 'assigned'
 ? 'bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-800'
 : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800 '
 }`}
 >
 Assigned (Pending)
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'assigned' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-700 text-slate-300'}`}>
 {assigned.length}
 </span>
 </button>
 <button
 onClick={() => setActiveTab('solved')}
 className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
 activeTab === 'solved'
 ? 'bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-800'
 : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800 '
 }`}
 >
 Solved
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'solved' ? 'bg-blue-500/20 text-blue-500' : 'bg-slate-700 text-slate-300'}`}>
 {solved.length}
 </span>
 </button>
 </div>

 {/* List / Table */}
 <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
 {activeComplaints.length === 0 ? (
 <div className="text-center py-16 px-4">
 <svg className="w-16 h-16 text-slate-400 mx-auto mb-4"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
 </svg>
 <p className="text-slate-400 text-lg">No complaints found in this category.</p>
 </div>
) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-300 text-sm">
 <th className="font-semibold p-4">ID</th>
 <th className="font-semibold p-4 min-w-[300px]">Description</th>
 <th className="font-semibold p-4">Category</th>
 <th className="font-semibold p-4">Status</th>
 <th className="font-semibold p-4">Priority</th>
 <th className="font-semibold p-4">Date</th>
 <th className="font-semibold p-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800">
 {activeComplaints.map(complaint => (
 <tr key={complaint.id} className="hover:bg-slate-800 transition-colors group">
 <td className="p-4 align-top">
 <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-800">
 #{complaint.id.toString().padStart(4, '0')}
 </span>
 </td>
 <td className="p-4 align-top">
 <h3 className="text-sm font-semibold text-slate-50 mb-1 line-clamp-2"title={complaint.description}>
 {complaint.description}
 </h3>
 {complaint.location && (
 <span className="text-xs flex items-center gap-1 text-slate-400 mt-1">
 <svg className="w-3.5 h-3.5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
 </svg>
 {complaint.location}
 </span>
)}
 </td>
 <td className="p-4 align-top">
 {complaint.category && (
 <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-800">
 {complaint.category.replace('_', ' ')}
 </span>
)}
 </td>
 <td className="p-4 align-top">
 {getStatusBadge(complaint.status)}
 </td>
 <td className="p-4 align-top">
 <span className="flex items-center gap-1.5 text-sm">
 <svg className="w-4 h-4 text-blue-600 dark:text-blue-500"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
 </svg>
 <span className="font-semibold text-slate-50">{complaint.priorityScore.toFixed(1)}</span>
 </span>
 </td>
 <td className="p-4 align-top text-sm font-medium text-slate-300 whitespace-nowrap">
 {new Date(complaint.createdAt).toLocaleDateString()}
 </td>
 <td className="p-4 align-top text-right">
 {activeTab !== 'solved' && (
 <button
 onClick={() => openAssignModal(complaint)}
 className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 !text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm"
 >
 <svg className="w-4 h-4"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
 </svg>
 {complaint.assignedOfficer ? 'Re-assign' : 'Assign'}
 </button>
)}
 </td>
 </tr>
))}
 </tbody>
 </table>
 </div>
)}
 </div>

 {/* Assign Modal */}
 {assignModalOpen && selectedComplaint && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
 <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden"onClick={e => e.stopPropagation()}>
 <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
 <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
 <svg className="w-5 h-5 text-blue-500"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
 </svg>
 Assign Complaint #{selectedComplaint.id.toString().padStart(4, '0')}
 </h2>
 <button onClick={closeAssignModal}
 className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800 transition-colors"
 >
 <svg className="w-5 h-5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
 </svg>
 </button>
 </div>
 <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
 <div className="mb-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
 <h3 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wider">Complaint Details</h3>
 <p className="text-slate-200 font-medium mb-2">{selectedComplaint.description}</p>
 <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
 <span className="flex items-center gap-1.5"><strong className="text-slate-300">Department:</strong> {selectedComplaint.departmentId || 'Any'}</span>
 <span className="flex items-center gap-1.5"><strong className="text-slate-300">Ward:</strong> {selectedComplaint.wardId}</span>
 <span className="flex items-center gap-1.5"><strong className="text-slate-300">Score:</strong> {selectedComplaint.priorityScore.toFixed(1)}</span>
 </div>
 </div>

 <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-50 mb-4">
 Available Officers
 {isLoadingOfficers && <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>}
 </h3>

 {!isLoadingOfficers && officers.length === 0 ? (
 <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
 <p className="text-slate-400">No officers found for this department.</p>
 </div>
) : (
 <div className="grid gap-4">
 {officers.map(officer => {
 const isAssigned = selectedComplaint.assignedOfficer === officer.id;
 const isAssigning = assigningId === officer.id;
 return (
 <div key={officer.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
 <div className="flex justify-between items-start mb-3">
 <div className="flex gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
 {officer.fullName.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-semibold text-slate-50 text-base leading-tight">{officer.fullName}</div>
 <div className="text-sm text-slate-400 flex items-center gap-1">
 <svg className="w-3.5 h-3.5"fill="none"viewBox="0 0 24 24"stroke="currentColor">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
 </svg>
 {officer.email}
 </div>
 </div>
 </div>
 <button
 onClick={() => handleAssign(officer.id)}
 disabled={isAssigning || isAssigned}
 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
 isAssigned ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-800'
 : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 !text-white shadow-sm'
 }`}
 >
 {isAssigning && <span className="w-3.5 h-3.5 border-2 border-inherit border-t-transparent rounded-full animate-spin"></span>}
 {isAssigned ? 'Assigned' : 'Assign'}
 </button>
 </div>

 <div className="mt-2 bg-slate-900 flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-700/50">
 <span className="text-sm font-medium text-slate-400">Current Workload</span>
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
 officer.workload > 5 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
 officer.workload > 2 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
 }`}>
 {officer.workload} active complaint{officer.workload !== 1 ? 's' : ''}
 </span>
 </div>
 {officer.workload > 0 && (
 <div className="mt-3">
 <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Active Complaints:</p>
 <div className="flex flex-wrap gap-2">
 {officer.assignedComplaints.map(c => (
 <span key={c.id} title={`Priority: ${c.priorityScore.toFixed(1)} | Created: ${new Date(c.createdAt).toLocaleDateString()}`} className="text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm">
 #{c.id.toString().padStart(4, '0')}
 <div className={`w-1.5 h-1.5 rounded-full ${c.priorityScore > 8 ? 'bg-red-500' : c.priorityScore > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
 </span>
))}
 </div>
 </div>
)}
 </div>
);
 })}
 </div>
)}
 </div>
 </div>
 </div>
)}
 </div>
);
};

export default ManageComplaints;
