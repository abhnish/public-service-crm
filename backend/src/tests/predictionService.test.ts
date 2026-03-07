import { predictComplaints, createSampleTimeSeries } from '../services/predictionService';

// Mock complaint data for testing
const mockComplaints = [
  {
    id: 1,
    createdAt: '2026-03-01T10:00:00Z',
    wardId: 1,
    departmentId: 1
  },
  {
    id: 2,
    createdAt: '2026-03-01T14:00:00Z',
    wardId: 1,
    departmentId: 2
  },
  {
    id: 3,
    createdAt: '2026-03-02T09:00:00Z',
    wardId: 2,
    departmentId: 1
  },
  {
    id: 4,
    createdAt: '2026-03-02T16:00:00Z',
    wardId: 1,
    departmentId: 1
  },
  {
    id: 5,
    createdAt: '2026-03-03T11:00:00Z',
    wardId: 2,
    departmentId: 2
  },
  {
    id: 6,
    createdAt: '2026-03-03T15:00:00Z',
    wardId: 1,
    departmentId: 1
  },
  {
    id: 7,
    createdAt: '2026-03-04T10:00:00Z',
    wardId: 2,
    departmentId: 1
  },
  {
    id: 8,
    createdAt: '2026-03-04T14:00:00Z',
    wardId: 1,
    departmentId: 2
  },
  {
    id: 9,
    createdAt: '2026-03-05T09:00:00Z',
    wardId: 1,
    departmentId: 1
  },
  {
    id: 10,
    createdAt: '2026-03-05T16:00:00Z',
    wardId: 2,
    departmentId: 2
  },
  {
    id: 11,
    createdAt: '2026-03-06T10:00:00Z',
    wardId: 1,
    departmentId: 1
  },
  {
    id: 12,
    createdAt: '2026-03-06T14:00:00Z',
    wardId: 2,
    departmentId: 1
  },
  {
    id: 13,
    createdAt: '2026-03-07T11:00:00Z',
    wardId: 1,
    departmentId: 2
  },
  {
    id: 14,
    createdAt: '2026-03-07T15:00:00Z',
    wardId: 2,
    departmentId: 1
  }
];

describe('Prediction Service', () => {
  describe('predictComplaints', () => {
    it('should return predictions grouped by ward', async () => {
      const predictions = await predictComplaints(mockComplaints, {
        periodDays: 7,
        groupBy: 'ward'
      });

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);

      // Check structure of predictions
      predictions.forEach(prediction => {
        expect(prediction).toHaveProperty('wardId');
        expect(prediction).toHaveProperty('wardName');
        expect(prediction).toHaveProperty('predictedComplaints');
        expect(prediction).toHaveProperty('confidence');
        expect(prediction).toHaveProperty('risk');
        expect(prediction).toHaveProperty('historicalAverage');
        expect(prediction).toHaveProperty('trend');

        // Check data types
        expect(typeof prediction.wardId).toBe('number');
        expect(typeof prediction.wardName).toBe('string');
        expect(typeof prediction.predictedComplaints).toBe('number');
        expect(typeof prediction.confidence).toBe('number');
        expect(['low', 'medium', 'high']).toContain(prediction.risk);
        expect(typeof prediction.historicalAverage).toBe('number');
        expect(typeof prediction.trend).toBe('number');

        // Check value ranges
        expect(prediction.predictedComplaints).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });

      // Should be sorted by predicted complaints (descending)
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i-1].predictedComplaints).toBeGreaterThanOrEqual(predictions[i].predictedComplaints);
      }
    });

    it('should return predictions grouped by department', async () => {
      const predictions = await predictComplaints(mockComplaints, {
        periodDays: 7,
        groupBy: 'department'
      });

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      expect(predictions.length).toBeGreaterThan(0);

      // Check structure for department grouping
      predictions.forEach(prediction => {
        expect(prediction).toHaveProperty('departmentId');
        expect(prediction).toHaveProperty('departmentName');
        expect(prediction).not.toHaveProperty('wardId');
        expect(prediction).not.toHaveProperty('wardName');
      });
    });

    it('should handle empty complaint data', async () => {
      const predictions = await predictComplaints([], {
        periodDays: 7,
        groupBy: 'ward'
      });

      expect(predictions).toEqual([]);
    });

    it('should handle single complaint', async () => {
      const singleComplaint = [mockComplaints[0]];
      const predictions = await predictComplaints(singleComplaint, {
        periodDays: 7,
        groupBy: 'ward'
      });

      expect(predictions).toBeDefined();
      expect(predictions.length).toBe(1);
      expect(predictions[0].predictedComplaints).toBeGreaterThanOrEqual(0);
    });

    it('should use default parameters', async () => {
      const predictions = await predictComplaints(mockComplaints);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe('createSampleTimeSeries', () => {
    it('should create sample time series data', () => {
      const timeSeries = createSampleTimeSeries();

      expect(timeSeries).toBeDefined();
      expect(Array.isArray(timeSeries)).toBe(true);
      expect(timeSeries.length).toBe(14);

      // Check structure
      timeSeries.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('count');
        expect(typeof point.date).toBe('string');
        expect(typeof point.count).toBe('number');
        expect(point.count).toBeGreaterThanOrEqual(0);
      });

      // Check date format (YYYY-MM-DD)
      expect(timeSeries[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Check that counts are reasonable
      const counts = timeSeries.map(p => p.count);
      expect(Math.min(...counts)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...counts)).toBeLessThan(100); // Reasonable upper bound
    });

    it('should have increasing trend in sample data', () => {
      const timeSeries = createSampleTimeSeries();
      
      // Sample data should generally show an increasing trend
      const firstHalf = timeSeries.slice(0, 7);
      const secondHalf = timeSeries.slice(7);
      
      const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.count, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.count, 0) / secondHalf.length;
      
      expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
    });
  });
});

// Integration test with realistic data
describe('Prediction Service Integration', () => {
  it('should handle realistic complaint patterns', async () => {
    // Create more realistic complaint data with patterns
    const realisticComplaints = [];
    const startDate = new Date('2026-03-01');
    
    // Generate 30 days of complaint data
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Ward 1: Increasing trend (weekend spikes)
      const dayOfWeek = currentDate.getDay();
      const ward1Complaints = (dayOfWeek === 0 || dayOfWeek === 6) ? 3 : 1; // Weekend spike
      for (let i = 0; i < ward1Complaints + Math.floor(day / 5); i++) {
        realisticComplaints.push({
          id: realisticComplaints.length + 1,
          createdAt: currentDate.toISOString(),
          wardId: 1,
          departmentId: 1
        });
      }
      
      // Ward 2: Stable pattern
      const ward2Complaints = 2;
      for (let i = 0; i < ward2Complaints; i++) {
        realisticComplaints.push({
          id: realisticComplaints.length + 1,
          createdAt: currentDate.toISOString(),
          wardId: 2,
          departmentId: 2
        });
      }
    }

    const predictions = await predictComplaints(realisticComplaints, {
      periodDays: 7,
      groupBy: 'ward'
    });

    expect(predictions).toBeDefined();
    expect(predictions.length).toBe(2);

    // Ward 1 should have higher predictions due to increasing trend
    const ward1Prediction = predictions.find(p => p.wardId === 1);
    const ward2Prediction = predictions.find(p => p.wardId === 2);

    expect(ward1Prediction).toBeDefined();
    expect(ward2Prediction).toBeDefined();
    
    // Ward 1 should predict more complaints than Ward 2
    expect(ward1Prediction!.predictedComplaints).toBeGreaterThan(ward2Prediction!.predictedComplaints);
    
    // Ward 1 should have higher risk due to increasing trend
    expect(['medium', 'high']).toContain(ward1Prediction!.risk);
    expect(ward2Prediction!.risk).toBe('low'); // Stable pattern = low risk
  });
});
