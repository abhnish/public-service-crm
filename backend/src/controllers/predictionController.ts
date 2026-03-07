import { Request, Response } from 'express';
import { predictComplaints } from '../services/predictionService';

// Middleware to load complaints data
const loadComplaintsData = (req: Request, res: Response, next: any) => {
  try {
    // Load complaints from persistent storage
    const fs = require('fs');
    const path = require('path');
    const dataFile = path.join(__dirname, '../../data/complaints.json');
    
    if (fs.existsSync(dataFile)) {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      (req as any).complaints = data.complaints || [];
    } else {
      (req as any).complaints = [];
    }
    next();
  } catch (error) {
    console.error('Error loading complaints data:', error);
    (req as any).complaints = [];
    next();
  }
};

// Get predictions for next N days
export const getPredictions = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const groupBy = (req.query.groupBy as string) || 'ward';
    
    // Validate inputs
    if (days < 1 || days > 30) {
      return res.status(400).json({ 
        error: 'Days parameter must be between 1 and 30' 
      });
    }
    
    if (!['ward', 'department'].includes(groupBy)) {
      return res.status(400).json({ 
        error: 'GroupBy parameter must be either "ward" or "department"' 
      });
    }
    
    // Get complaints data
    const complaints = (req as any).complaints || [];
    
    // Generate predictions
    const predictions = await predictComplaints(complaints, {
      periodDays: days,
      groupBy: groupBy as 'ward' | 'department'
    });
    
    // Return response with metadata
    res.json({
      predictions,
      metadata: {
        periodDays: days,
        groupBy,
        totalComplaints: complaints.length,
        generatedAt: new Date().toISOString(),
        algorithm: 'rolling_average_linear_trend'
      }
    });
    
  } catch (error: any) {
    console.error('Prediction generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate predictions. Please try again later.' 
    });
  }
};

// Export middleware and controller
export { loadComplaintsData };
