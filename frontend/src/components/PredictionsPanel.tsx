import React, { useState, useEffect } from 'react';
import { predictionsAPI } from '../services/api';

interface Prediction {
  wardId?: number;
  wardName?: string;
  departmentId?: number;
  departmentName?: string;
  predictedComplaints: number;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  historicalAverage: number;
  trend: number;
}

interface PredictionsData {
  predictions: Prediction[];
  metadata: {
    periodDays: number;
    groupBy: string;
    totalComplaints: number;
    generatedAt: string;
    algorithm: string;
  };
}

const PredictionsPanel: React.FC<{ onWardFilter?: (wardId: number) => void }> = ({ onWardFilter }) => {
  const [predictionsData, setPredictionsData] = useState<PredictionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);
  const [groupBy, setGroupBy] = useState<'ward' | 'department'>('ward');

  useEffect(() => {
    fetchPredictions();
  }, [days, groupBy]);

  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await predictionsAPI.getPredictions({ days, groupBy });
      setPredictionsData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load predictions');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.01) return '📈';
    if (trend < -0.01) return '📉';
    return '➡️';
  };

  const handleWardClick = (wardId: number) => {
    if (onWardFilter) {
      onWardFilter(wardId);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaint Predictions</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-gray-600">Loading predictions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaint Predictions</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!predictionsData || predictionsData.predictions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaint Predictions</h3>
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded">
          No predictions available. Insufficient historical data.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Complaint Predictions</h3>
        <div className="flex space-x-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={21}>21 Days</option>
            <option value={30}>30 Days</option>
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'ward' | 'department')}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ward">By Ward</option>
            <option value="department">By Department</option>
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Algorithm: {predictionsData.metadata.algorithm}</span>
          <span>Based on {predictionsData.metadata.totalComplaints} historical complaints</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Generated: {new Date(predictionsData.metadata.generatedAt).toLocaleString()}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">
                {groupBy === 'ward' ? 'Ward' : 'Department'}
              </th>
              <th className="text-right py-2 px-2">Predicted</th>
              <th className="text-right py-2 px-2">Historical Avg</th>
              <th className="text-center py-2 px-2">Trend</th>
              <th className="text-center py-2 px-2">Risk</th>
              <th className="text-center py-2 px-2">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {predictionsData.predictions.map((prediction, index) => (
              <tr 
                key={index} 
                className={`border-b hover:bg-gray-50 ${prediction.wardId ? 'cursor-pointer' : ''}`}
                onClick={() => prediction.wardId && handleWardClick(prediction.wardId!)}
              >
                <td className="py-2 px-2 font-medium">
                  {prediction.wardName || prediction.departmentName}
                </td>
                <td className="text-right py-2 px-2">
                  <span className="font-semibold">{prediction.predictedComplaints}</span>
                </td>
                <td className="text-right py-2 px-2 text-gray-600">
                  {prediction.historicalAverage.toFixed(1)}
                </td>
                <td className="text-center py-2 px-2">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">{getTrendIcon(prediction.trend)}</span>
                    <span className={prediction.trend > 0.01 ? 'text-red-600' : prediction.trend < -0.01 ? 'text-green-600' : 'text-gray-600'}>
                      {formatPercentage(Math.abs(prediction.trend))}
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 px-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(prediction.risk)}`}>
                    {prediction.risk.toUpperCase()}
                  </span>
                </td>
                <td className="text-center py-2 px-2">
                  <div className="flex items-center justify-center">
                    <div className="w-8 bg-gray-200 rounded-full h-2 mr-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                      {formatPercentage(prediction.confidence)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {predictionsData.predictions.some(p => p.wardId) && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Click on a ward row to filter the heatmap
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700 mb-1">Risk Levels</div>
          <div className="space-y-1">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-red-100 text-red-600 rounded text-xs mr-2">H</span>
              <span>High: &gt;50% above average</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-100 text-yellow-600 rounded text-xs mr-2">M</span>
              <span>Medium: 20-50% above average</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-100 text-green-600 rounded text-xs mr-2">L</span>
              <span>Low: &lt;20% above average</span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700 mb-1">Algorithm</div>
          <div className="text-gray-600">
            Rolling average + linear trend analysis on historical complaint patterns
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="font-medium text-gray-700 mb-1">Confidence</div>
          <div className="text-gray-600">
            Based on data consistency and historical data volume
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionsPanel;
