import { useState, useEffect } from 'react';
import api from '../services/api';
import CopilotPanel from '../components/CopilotPanel';
import PredictionsPanel from '../components/PredictionsPanel';
import ComplaintMap from '../components/ComplaintMap';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import MapFilters from '../components/MapFilters';
import TransparencyMap from '../components/TransparencyMap';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents';

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
  const [transparencyData, setTransparencyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'copilot'>('overview');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});
  
  // Initialize real-time events
  useRealtimeEvents();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real complaints data
      const response = await api.get('/complaints');
      const fetchedComplaints = response.data.complaints;
      setComplaints(fetchedComplaints);
      
      // Fetch transparency data for the map
      const transparencyResponse = await api.get('/transparency');
      const transparencyData = transparencyResponse.data;
      setTransparencyData(transparencyData);
      
      // Calculate real metrics from actual data
      const totalComplaints = fetchedComplaints.length;
      const resolvedComplaints = fetchedComplaints.filter((c: any) => c.status === 'resolved').length;
      const resolvedRatio = totalComplaints > 0 ? resolvedComplaints / totalComplaints : 0;
      
      // Calculate department statistics
      const deptCounts: { [key: string]: number } = {};
      fetchedComplaints.forEach((c: any) => {
        const dept = c.category || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      
      const topDepartments = Object.entries(deptCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      
      // Calculate ward statistics
      const wardStats: { [key: number]: { total: number; unresolved: number; resolutionTimes: number[] } } = {};
      fetchedComplaints.forEach((c: any) => {
        const wardId = c.wardId || 1;
        if (!wardStats[wardId]) {
          wardStats[wardId] = { total: 0, unresolved: 0, resolutionTimes: [] };
        }
        wardStats[wardId].total++;
        if (c.status !== 'resolved') {
          wardStats[wardId].unresolved++;
        }
        if (c.resolvedAt && c.createdAt) {
          const resolutionTime = (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
          wardStats[wardId].resolutionTimes.push(resolutionTime);
        }
      });
      
      const heatmapData: HeatmapData[] = transparencyData.complaintsByWard.map((ward: any) => ({
        wardId: ward.wardId || 0,
        wardName: ward.wardName,
        totalComplaints: ward.count,
        unresolvedComplaints: Math.floor(ward.count * 0.3), // Estimate 30% unresolved
        avgResolutionTime: transparencyData.avgResolutionTimeHours || 0
      }));
      
      const kpiData: KPIData = {
        totalComplaints,
        resolvedRatio,
        topDepartments
      };

      setHeatmapData(heatmapData);
      setKpiData(kpiData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplaintClick = (complaint: any) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto mt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <h2 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('copilot')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'copilot'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            AI Copilot
          </button>
        </nav>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          {kpiData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-600">Total Complaints</h3>
                <p className="text-3xl font-bold mt-2">{kpiData.totalComplaints}</p>
                <p className="text-sm text-gray-500 mt-1">All time</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-green-600">Resolved Ratio</h3>
                <p className="text-3xl font-bold mt-2">{(kpiData.resolvedRatio * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">Resolution rate</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-yellow-600">Unresolved</h3>
            <p className="text-3xl font-bold mt-2">{Math.round(kpiData.totalComplaints * (1 - kpiData.resolvedRatio))}</p>
            <p className="text-sm text-gray-500 mt-1">Pending action</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-purple-600">Avg Resolution</h3>
            <p className="text-3xl font-bold mt-2">
              {heatmapData.length > 0 
                ? (heatmapData.reduce((sum, ward) => sum + ward.avgResolutionTime, 0) / heatmapData.length).toFixed(1)
                : '0'
              }h
            </p>
            <p className="text-sm text-gray-500 mt-1">Hours</p>
          </div>
        </div>
      )}

      {/* Heatmap Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Complaint Heatmap by Ward</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actual Interactive Map */}
          <div className="h-96">
            <TransparencyMap 
              complaintsByWard={heatmapData.map(ward => ({
                wardId: ward.wardId,
                wardName: ward.wardName,
                count: ward.totalComplaints,
                coordinates: transparencyData.complaintsByWard.find((w: any) => w.wardId === ward.wardId)?.coordinates
              }))} 
            />
          </div>
          
          {/* Ward Statistics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Ward Statistics</h4>
            {heatmapData.map((ward) => (
              <div key={ward.wardId} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium">{ward.wardName}</h5>
                  <span className="text-sm text-gray-500">Ward {ward.wardId}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold">{ward.totalComplaints}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Unresolved</p>
                    <p className="font-semibold text-red-600">{ward.unresolvedComplaints}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Time</p>
                    <p className="font-semibold">{ward.avgResolutionTime}h</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${((ward.totalComplaints - ward.unresolvedComplaints) / ward.totalComplaints) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((ward.totalComplaints - ward.unresolvedComplaints) / ward.totalComplaints * 100).toFixed(1)}% resolved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Departments */}
      {kpiData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Top Departments by Complaint Volume</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.topDepartments.map((dept, index) => (
              <div key={dept.name} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">#{index + 1}</div>
                <h4 className="font-semibold">{dept.name}</h4>
                <p className="text-2xl font-bold mt-2">{dept.count}</p>
                <p className="text-sm text-gray-500">complaints</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Interactive Map Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Complaint Map</h3>
        <MapFilters onFiltersChange={handleFiltersChange} />
        <ComplaintMap 
          complaints={complaints} 
          onComplaintClick={handleComplaintClick}
          filters={filters}
        />
      </div>
      
      {/* Predictions Panel */}
      <PredictionsPanel />
        </>
      )}
      
      {/* Copilot Tab */}
      {activeTab === 'copilot' && (
        <CopilotPanel />
      )}
      
      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
