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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Public Transparency Portal</h1>
              <p className="text-gray-600 mt-1">Aggregated complaint metrics and performance indicators</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🔄 Refresh
              </button>
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📊 Download CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Last Updated */}
        <div className="mb-6 text-sm text-gray-500">
          Last updated: {lastRefreshed ? lastRefreshed.toLocaleString() : 'Unknown'} | 
          Data freshness: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <div className="text-blue-600 text-2xl">📋</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Complaints</h3>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalComplaints)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <div className="text-green-600 text-2xl">✅</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Resolution Rate</h3>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.resolvedRatio)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <div className="text-yellow-600 text-2xl">⏱️</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Avg Resolution Time</h3>
                <p className="text-2xl font-bold text-gray-900">{formatHours(data.avgResolutionTimeHours)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Issues Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Issues by Department</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topIssues}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Complaints by Ward Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Ward</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.complaintsByWard}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.wardName}: ${((entry.count / data.totalComplaints) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.complaintsByWard.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Heatmap */}
        <div className="mb-8">
          <TransparencyMap complaintsByWard={data.complaintsByWard} />
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Issues Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topIssues.map((issue, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {issue.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(issue.count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercentage((issue.count / data.totalComplaints) * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ward Breakdown Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ward Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ward
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.complaintsByWard.map((ward, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ward.wardName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(ward.count)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercentage((ward.count / data.totalComplaints) * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Accessibility Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">📊 Data Summary</h2>
          <div className="text-blue-800 space-y-2">
            <p><strong>Total Performance:</strong> {formatNumber(data.totalComplaints)} complaints processed with {formatPercentage(data.resolvedRatio)} resolution rate.</p>
            <p><strong>Efficiency:</strong> Average resolution time of {formatHours(data.avgResolutionTimeHours)} per complaint.</p>
            <p><strong>Top Department:</strong> {data.topIssues[0]?.department || 'N/A'} with {formatNumber(data.topIssues[0]?.count || 0)} complaints.</p>
            <p><strong>Most Active Ward:</strong> {data.complaintsByWard[0]?.wardName || 'N/A'} with {formatNumber(data.complaintsByWard[0]?.count || 0)} complaints.</p>
          </div>
          <div className="mt-4">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📥 Download Full Dataset (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPortal;
