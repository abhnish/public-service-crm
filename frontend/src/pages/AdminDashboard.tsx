import { useState, useEffect } from 'react';

interface HeatmapData {
  wardId: number;
  wardName: string;
  totalComplaints: number;
  unresolvedComplaints: number;
  avgResolutionTime: number;
  geojson?: any;
}

interface KPIData {
  totalComplaints: number;
  resolvedRatio: number;
  topDepartments: { name: string; count: number }[];
}

const AdminDashboard = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock heatmap data - replace with actual API call when available
      const mockHeatmapData: HeatmapData[] = [
        { wardId: 1, wardName: 'Ward 1', totalComplaints: 45, unresolvedComplaints: 12, avgResolutionTime: 24.5 },
        { wardId: 2, wardName: 'Ward 2', totalComplaints: 38, unresolvedComplaints: 8, avgResolutionTime: 18.2 },
        { wardId: 3, wardName: 'Ward 3', totalComplaints: 52, unresolvedComplaints: 15, avgResolutionTime: 31.7 },
      ];

      // Mock KPI data - replace with actual API call when available
      const mockKpiData: KPIData = {
        totalComplaints: 135,
        resolvedRatio: 0.76,
        topDepartments: [
          { name: 'Water Supply', count: 42 },
          { name: 'Road Damage', count: 38 },
          { name: 'Sanitation', count: 28 },
          { name: 'Electricity', count: 27 },
        ]
      };

      setHeatmapData(mockHeatmapData);
      setKpiData(mockKpiData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 pb-12 font-sans selection:bg-cyan-500/30">
      <h2 className="text-slate-50 text-3xl font-bold tracking-tight mb-8">Admin Dashboard</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
          {error}
        </div>
      )}
      
      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
            <h3 className="text-cyan-400 text-sm uppercase tracking-wider font-semibold">Total Complaints</h3>
            <p className="text-slate-50 text-4xl font-bold mt-3 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] transition-all">{kpiData.totalComplaints}</p>
            <p className="text-slate-400 text-sm mt-1">All time</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
            <h3 className="text-emerald-400 text-sm uppercase tracking-wider font-semibold">Resolved Ratio</h3>
            <p className="text-slate-50 text-4xl font-bold mt-3 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] transition-all">{(kpiData.resolvedRatio * 100).toFixed(1)}%</p>
            <p className="text-slate-400 text-sm mt-1">Resolution rate</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
            <h3 className="text-rose-400 text-sm uppercase tracking-wider font-semibold">Unresolved</h3>
            <p className="text-slate-50 text-4xl font-bold mt-3 group-hover:drop-shadow-[0_0_8px_rgba(251,113,133,0.3)] transition-all">{Math.round(kpiData.totalComplaints * (1 - kpiData.resolvedRatio))}</p>
            <p className="text-slate-400 text-sm mt-1">Pending action</p>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
            <h3 className="text-indigo-400 text-sm uppercase tracking-wider font-semibold">Avg Resolution</h3>
            <p className="text-slate-50 text-4xl font-bold mt-3 group-hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.3)] transition-all">
              {heatmapData.length > 0 
                ? (heatmapData.reduce((sum, ward) => sum + ward.avgResolutionTime, 0) / heatmapData.length).toFixed(1)
                : '0'
              }h
            </p>
            <p className="text-slate-400 text-sm mt-1">Hours</p>
          </div>
        </div>
      )}

      {/* Heatmap Section */}
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl mb-8 backdrop-blur-sm">
        <h3 className="text-slate-50 text-xl font-bold mb-6">Complaint Heatmap by Ward</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Placeholder */}
          <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-50 grayscale">🗺️</div>
              <p className="text-slate-400 font-medium">Interactive Map Data</p>
              <p className="text-sm text-slate-500 mt-1">GIS visualization pending initialization</p>
            </div>
          </div>
          
          {/* Ward Statistics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-sm mb-4">Ward Statistics</h4>
            {heatmapData.map((ward) => (
              <div key={ward.wardId} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-slate-50">{ward.wardName}</h5>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700">Ward {ward.wardId}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total</p>
                    <p className="font-bold text-slate-200">{ward.totalComplaints}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Unresolved</p>
                    <p className="font-bold text-rose-400">{ward.unresolvedComplaints}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Avg Time</p>
                    <p className="font-bold text-slate-200">{ward.avgResolutionTime}h</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Resolution Progress</span>
                    <span className="text-cyan-400 font-bold">{((ward.totalComplaints - ward.unresolvedComplaints) / ward.totalComplaints * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                      style={{ width: `${((ward.totalComplaints - ward.unresolvedComplaints) / ward.totalComplaints) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Departments */}
      {kpiData && (
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
          <h3 className="text-slate-50 text-xl font-bold mb-6">Top Departments by Volume</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.topDepartments.map((dept, index) => (
              <div key={dept.name} className="bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80 p-6 rounded-xl flex flex-col items-center justify-center transition-all duration-300 group">
                <div className="text-4xl font-black text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] mb-3 group-hover:scale-110 transition-transform">#{index + 1}</div>
                <h4 className="font-bold text-slate-50 text-center mb-1">{dept.name}</h4>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <p className="text-2xl font-bold text-slate-200">{dept.count}</p>
                  <p className="text-xs text-slate-500 uppercase font-semibold">cases</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
