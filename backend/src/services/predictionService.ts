interface PredictionInput {
  periodDays?: number;
  groupBy?: 'ward' | 'department';
}

interface HistoricalData {
  date: string;
  count: number;
}

interface PredictionResult {
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

interface ComplaintData {
  id: number;
  createdAt: string;
  wardId?: number;
  departmentId?: number;
}

// Simple linear regression to calculate trend
function calculateLinearTrend(data: HistoricalData[]): number {
  if (data.length < 2) return 0;
  
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  data.forEach((point, index) => {
    const x = index;
    const y = point.count;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  
  // Calculate slope (trend)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Normalize slope to get trend factor (relative to average)
  const avgY = sumY / n;
  const trendFactor = avgY > 0 ? slope / avgY : 0;
  
  return trendFactor;
}

// Calculate moving average
function calculateMovingAverage(data: HistoricalData[], window: number): number {
  if (data.length === 0) return 0;
  
  const recentData = data.slice(-window);
  const sum = recentData.reduce((acc, point) => acc + point.count, 0);
  return sum / recentData.length;
}

// Calculate confidence based on data consistency and amount
function calculateConfidence(data: HistoricalData[]): number {
  if (data.length < 3) return 0.3; // Low confidence for sparse data
  
  // Calculate variance
  const mean = data.reduce((acc, point) => acc + point.count, 0) / data.length;
  const variance = data.reduce((acc, point) => acc + Math.pow(point.count - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = higher confidence
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
  const consistencyScore = Math.max(0, 1 - coefficientOfVariation);
  
  // More data points = higher confidence
  const dataPointsScore = Math.min(1, data.length / 14); // 14 days = full confidence
  
  return (consistencyScore * 0.7) + (dataPointsScore * 0.3);
}

// Determine risk level based on prediction vs historical average
function calculateRiskLevel(prediction: number, historicalAverage: number): 'low' | 'medium' | 'high' {
  if (historicalAverage === 0) return 'low';
  
  const ratio = prediction / historicalAverage;
  
  if (ratio > 1.5) return 'high';
  if (ratio > 1.2) return 'medium';
  return 'low';
}

// Group complaints by date and ward/department
function groupComplaintsByDate(complaints: ComplaintData[], groupBy: 'ward' | 'department'): Map<string, Map<string, number>> {
  const groupedData = new Map<string, Map<string, number>>();
  
  complaints.forEach(complaint => {
    const date = complaint.createdAt.split('T')[0]; // Extract date part
    const groupKey = groupBy === 'ward' ? `ward_${complaint.wardId || 1}` : `dept_${complaint.departmentId || 1}`;
    
    if (!groupedData.has(date)) {
      groupedData.set(date, new Map());
    }
    
    const dateGroup = groupedData.get(date)!;
    dateGroup.set(groupKey, (dateGroup.get(groupKey) || 0) + 1);
  });
  
  return groupedData;
}

// Generate time series data for each group
function generateTimeSeries(groupedData: Map<string, Map<string, number>>, groupKey: string, days: number): HistoricalData[] {
  const series: HistoricalData[] = [];
  const endDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dateGroup = groupedData.get(dateStr);
    const count = dateGroup?.get(groupKey) || 0;
    
    series.push({
      date: dateStr,
      count
    });
  }
  
  return series;
}

// Main prediction function
export async function predictComplaints(
  complaints: ComplaintData[],
  options: PredictionInput = {}
): Promise<PredictionResult[]> {
  const { periodDays = 7, groupBy = 'ward' } = options;
  
  // Group complaints by date and ward/department
  const groupedData = groupComplaintsByDate(complaints, groupBy);
  
  // Get all unique group keys
  const allGroupKeys = new Set<string>();
  groupedData.forEach(dateGroup => {
    dateGroup.forEach((_, key) => allGroupKeys.add(key));
  });
  
  const predictions: PredictionResult[] = [];
  
  // Generate prediction for each group
  for (const groupKey of allGroupKeys) {
    // Generate time series for this group
    const timeSeries = generateTimeSeries(groupedData, groupKey, 14); // Use 14 days of historical data
    
    if (timeSeries.length === 0) {
      continue;
    }
    
    // Calculate metrics
    const historicalAverage = timeSeries.reduce((sum, point) => sum + point.count, 0) / timeSeries.length;
    const movingAverage = calculateMovingAverage(timeSeries, 7);
    const trend = calculateLinearTrend(timeSeries);
    const confidence = calculateConfidence(timeSeries);
    
    // Apply smoothing factor
    const smoothingFactor = 0.7; // Weight recent average more heavily
    const basePrediction = movingAverage * smoothingFactor + historicalAverage * (1 - smoothingFactor);
    
    // Apply trend adjustment
    const trendAdjustment = 1 + (trend * periodDays); // Adjust for prediction period
    const predictedComplaints = Math.max(0, Math.round(basePrediction * trendAdjustment));
    
    // Determine risk level
    const risk = calculateRiskLevel(predictedComplaints, historicalAverage);
    
    // Extract group info
    const [groupType, groupId] = groupKey.split('_');
    const numericId = parseInt(groupId);
    
    const prediction: PredictionResult = {
      predictedComplaints,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      risk,
      historicalAverage: Math.round(historicalAverage * 100) / 100,
      trend: Math.round(trend * 1000) / 1000 // Round to 3 decimal places
    };
    
    if (groupType === 'ward') {
      prediction.wardId = numericId;
      prediction.wardName = `Ward ${numericId}`;
    } else {
      prediction.departmentId = numericId;
      prediction.departmentName = `Department ${numericId}`;
    }
    
    predictions.push(prediction);
  }
  
  // Sort by predicted complaints (descending)
  predictions.sort((a, b) => b.predictedComplaints - a.predictedComplaints);
  
  return predictions;
}

// Utility function for testing with sample data
export function createSampleTimeSeries(): HistoricalData[] {
  return [
    { date: '2026-03-01', count: 5 },
    { date: '2026-03-02', count: 7 },
    { date: '2026-03-03', count: 6 },
    { date: '2026-03-04', count: 8 },
    { date: '2026-03-05', count: 9 },
    { date: '2026-03-06', count: 11 },
    { date: '2026-03-07', count: 10 },
    { date: '2026-03-08', count: 12 },
    { date: '2026-03-09', count: 13 },
    { date: '2026-03-10', count: 11 },
    { date: '2026-03-11', count: 14 },
    { date: '2026-03-12', count: 15 },
    { date: '2026-03-13', count: 16 },
    { date: '2026-03-14', count: 18 }
  ];
}
