import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import TransparencyMap from '../components/TransparencyMap';

interface TransparencyData {
  totalComplaints: number;
  resolvedRatio: number;
  avgResolutionTimeHours: number;
  topIssues: Array<{ department: string; count: number }>;
  complaintsByWard: Array<{ 
    wardId: number | null; 
    wardName: string; 
    count: number;
    coordinates?: {
      lat: number;
      lng: number;
      bounds: [[number, number], [number, number]];
    };
  }>;
  lastUpdated: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const TransparencyPortal: React.FC = () => {
  const [data, setData] = useState<TransparencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/transparency');
      setData(response.data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load transparency data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await api.get('/transparency/csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transparency-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download CSV');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center bg-slate-900/50 border border-slate-800 p-8 rounded-2xl backdrop-blur-md max-w-md">
          <div className="text-red-400 text-3xl mb-4">⚠️</div>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 transition-colors w-full"
          >
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden pb-12">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">Public Transparency Portal</h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Aggregated complaint metrics and performance indicators</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-cyan-400 hover:bg-slate-700 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Sync
              </button>
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Last Updated */}
        <div className="mb-8 flex items-center gap-3 text-sm text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          Node active • Last synced: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Unknown'} • 
          Data freshness: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'Unknown'}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-1">Total Volume</h3>
                <p className="text-xl sm:text-3xl font-bold text-slate-50">{formatNumber(data.totalComplaints)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-1">Clearance Rate</h3>
                <p className="text-xl sm:text-3xl font-bold text-slate-50">{formatPercentage(data.resolvedRatio)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-1">Avg Turnaround</h3>
                <p className="text-xl sm:text-3xl font-bold text-slate-50">{formatHours(data.avgResolutionTimeHours)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
          {/* Top Issues Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-semibold text-slate-50 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
              Volume by Sector
            </h2>
            {data.topIssues && data.topIssues.length > 0 ? (
              <div className="h-[250px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topIssues}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="department" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke="#94a3b8"
                      tick={{fill: '#94a3b8', fontSize: 12}}
                    />
                    <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem' }} 
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="text-4xl mb-2 grayscale opacity-50">📊</div>
                  <p>No department data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Complaints by Ward Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
            <h2 className="text-base sm:text-lg font-semibold text-slate-50 mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              Distribution by Zone
            </h2>
            {data.complaintsByWard && data.complaintsByWard.length > 0 ? (
              <div className="h-[250px] sm:h-[300px] flex flex-col">
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.complaintsByWard}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        stroke="none"
                      >
                        {data.complaintsByWard.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.75rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                   {data.complaintsByWard.slice(0, 4).map((ward, idx) => (
                      <div key={idx} className="flex items-center text-xs text-slate-400">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        {ward.wardName}
                      </div>
                   ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="text-4xl mb-2 grayscale opacity-50">🗺️</div>
                  <p>No ward data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Geographic Heatmap */}
        <div className="mb-8">
           <h2 className="text-lg font-semibold text-slate-50 mb-4 px-2">Live Heatmap</h2>
           <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50 p-2 shadow-xl">
             <div className="rounded-xl overflow-hidden border border-slate-800/50">
               <TransparencyMap complaintsByWard={data.complaintsByWard} />
             </div>
           </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
          {/* Top Issues Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-semibold text-slate-50">Department Breakdown</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.topIssues && data.topIssues.length > 0 ? (
                    data.topIssues.map((issue, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-200">
                          {issue.department}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400">
                          {formatNumber(issue.count)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                             <div className="hidden sm:block w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-cyan-500" style={{ width: `${(issue.count / data.totalComplaints) * 100}%` }}></div>
                             </div>
                             {formatPercentage((issue.count / data.totalComplaints) * 100)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                        <div className="text-4xl mb-2 grayscale opacity-50">📊</div>
                        <p>No department data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ward Breakdown Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-800">
              <h2 className="text-base sm:text-lg font-semibold text-slate-50">Zone Distribution</h2>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Ward
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Incidents
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.complaintsByWard && data.complaintsByWard.length > 0 ? (
                    data.complaintsByWard.map((ward, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-200">
                          {ward.wardName}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400">
                          {formatNumber(ward.count)}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-400">
                           <div className="flex items-center gap-2">
                             <div className="hidden sm:block w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-purple-500" style={{ width: `${(ward.count / data.totalComplaints) * 100}%` }}></div>
                             </div>
                             {formatPercentage((ward.count / data.totalComplaints) * 100)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                        <div className="text-4xl mb-2 grayscale opacity-50">🗺️</div>
                        <p>No ward data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Insights Summary */}
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          
          <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-3">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             System Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <p><strong>Total Performance:</strong> Analzyed <span className="text-slate-50 font-semibold">{formatNumber(data.totalComplaints)}</span> records with a strict clearance efficiency of <span className="text-emerald-400 font-semibold">{formatPercentage(data.resolvedRatio)}</span>.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <p><strong>Service Latency:</strong> Global node responses indicate an average physical resolution turnaround of <span className="text-slate-50 font-semibold">{formatHours(data.avgResolutionTimeHours)}</span> per incident.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                <p><strong>Hotspot Sector:</strong> The <span className="text-slate-50 font-semibold">{data.topIssues[0]?.department || 'N/A'}</span> unit is experiencing peak load with <span className="text-slate-50 font-semibold">{formatNumber(data.topIssues[0]?.count || 0)}</span> active or cleared tasks.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                <p><strong>Primary Zone:</strong> <span className="text-slate-50 font-semibold">{data.complaintsByWard[0]?.wardName || 'N/A'}</span> ranks as the highest urgency geographic cluster in the matrix.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-cyan-500/10 flex justify-end relative z-10">
            <button
              onClick={downloadCSV}
              className="px-6 py-2.5 bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Extract Raw DB (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPortal;
