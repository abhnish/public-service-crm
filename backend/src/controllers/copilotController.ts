import { Request, Response } from 'express';
import { analyzeMunicipalData } from '../services/copilotService';

interface CopilotRequest {
  question: string;
  scope?: {
    wardId?: number;
    departmentId?: number;
    dateFrom?: string;
    dateTo?: string;
  };
}

// Get analytics snapshot for copilot analysis
async function getAnalyticsSnapshot(req: Request, scope?: CopilotRequest['scope']) {
  // Get complaints data
  const complaints = (req as any).complaints || [];
  
  // Filter by scope if provided
  let filteredComplaints = [...complaints];
  
  if (scope?.wardId) {
    filteredComplaints = filteredComplaints.filter(c => c.wardId === scope.wardId);
  }
  
  if (scope?.departmentId) {
    filteredComplaints = filteredComplaints.filter(c => c.departmentId === scope.departmentId);
  }
  
  if (scope?.dateFrom || scope?.dateTo) {
    filteredComplaints = filteredComplaints.filter(c => {
      const complaintDate = new Date(c.createdAt);
      if (scope?.dateFrom && complaintDate < new Date(scope.dateFrom)) return false;
      if (scope?.dateTo && complaintDate > new Date(scope.dateTo)) return false;
      return true;
    });
  }

  // Calculate analytics
  const totalComplaints = filteredComplaints.length;
  const resolvedComplaints = filteredComplaints.filter(c => c.status === 'resolved').length;
  
  // Calculate average resolution time
  const resolvedCasesWithTime = filteredComplaints.filter(c => 
    c.status === 'resolved' && c.resolvedAt && c.createdAt
  );
  const avgResolutionTime = resolvedCasesWithTime.length > 0 
    ? resolvedCasesWithTime.reduce((sum, c) => {
        const resolutionTime = (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
        return sum + resolutionTime;
      }, 0) / resolvedCasesWithTime.length
    : 0;

  // Calculate top wards
  const wardCounts: { [key: number]: number } = {};
  filteredComplaints.forEach(c => {
    const wardId = c.wardId || 1;
    wardCounts[wardId] = (wardCounts[wardId] || 0) + 1;
  });
  
  const topWards = Object.entries(wardCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([wardId, count]) => ({
      id: parseInt(wardId),
      name: `Ward ${wardId}`,
      count
    }));

  // Calculate top departments
  const deptCounts: { [key: number]: number } = {};
  filteredComplaints.forEach(c => {
    const deptId = c.departmentId || 1;
    deptCounts[deptId] = (deptCounts[deptId] || 0) + 1;
  });
  
  const topDepartments = Object.entries(deptCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([deptId, count]) => ({
      id: parseInt(deptId),
      name: `Department ${deptId}`,
      count
    }));

  // Get recent complaints (last 10)
  const recentComplaints = filteredComplaints
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      description: c.description,
      status: c.status,
      wardId: c.wardId,
      departmentId: c.departmentId,
      createdAt: c.createdAt
    }));

  // Calculate escalation trend (comparing recent vs older period)
  const now = new Date();
  const recentPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  const olderPeriod = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 7-14 days ago
  
  const recentCount = filteredComplaints.filter(c => new Date(c.createdAt) >= recentPeriod).length;
  const olderCount = filteredComplaints.filter(c => {
    const date = new Date(c.createdAt);
    return date >= olderPeriod && date < recentPeriod;
  }).length;
  
  const escalationTrend = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0;

  return {
    totalComplaints,
    resolvedComplaints,
    avgResolutionTime,
    topWards,
    topDepartments,
    recentComplaints,
    escalationTrend
  };
}

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

// Main copilot endpoint
export const analyzeWithCopilot = async (req: Request, res: Response) => {
  try {
    const { question, scope }: CopilotRequest = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required and must be a non-empty string' 
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({ 
        error: 'Question is too long (max 1000 characters)' 
      });
    }

    // Get analytics snapshot
    const analyticsSnapshot = await getAnalyticsSnapshot(req, scope);

    // Get admin ID for rate limiting
    const adminId = (req as any).user?.id?.toString() || 'anonymous';

    // Analyze with copilot
    const result = await analyzeMunicipalData(question, analyticsSnapshot, adminId);

    // Add LLM status info
    const response = {
      ...result,
      llmEnabled: !!process.env.GEMINI_API_KEY,
      dataContext: {
        totalComplaints: analyticsSnapshot.totalComplaints,
        analysisScope: scope || 'all'
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Copilot analysis error:', error);
    
    if (error.message === 'Rate limit exceeded') {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before making another request.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to analyze question. Please try again later.' 
    });
  }
};

// Export middleware and controller
export { loadComplaintsData };
