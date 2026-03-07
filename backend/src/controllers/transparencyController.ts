import { Request, Response } from 'express';
import NodeCache from 'node-cache';

// Cache for transparency data (5 minutes TTL)
const transparencyCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

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

interface Complaint {
  id: number;
  status: string;
  departmentId?: number;
  wardId?: number;
  createdAt?: string;
  resolvedAt?: string;
}

export const getTransparencyData = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = 'transparency-data';
    let data = transparencyCache.get<TransparencyData>(cacheKey);
    
    if (!data) {
      // Import complaints data (in real app, this would be from database)
      let complaints: Complaint[] = [];
      let wards: any[] = [];
      let departments: any[] = [];

      try {
        const complaintsData = require('../../data/complaints.json');
        complaints = complaintsData.complaints || [];
      } catch (error) {
        console.log('Complaints data not found, using empty array');
      }

      try {
        wards = require('../../data/wards.json');
      } catch (error) {
        console.log('Wards data not found, using empty array');
      }

      try {
        departments = require('../../data/departments.json');
      } catch (error) {
        console.log('Departments data not found, using empty array');
      }

      // Calculate KPIs
      const totalComplaints = complaints.length;
      const resolvedComplaints = complaints.filter((c: Complaint) => c.status === 'resolved').length;
      const resolvedRatio = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0;

      // Calculate average resolution time
      const resolvedWithTime = complaints.filter((c: Complaint) => 
        c.status === 'resolved' && c.createdAt && c.resolvedAt
      );
      
      let avgResolutionTimeHours = 0;
      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((sum: number, complaint: Complaint) => {
          const created = new Date(complaint.createdAt!).getTime();
          const resolved = new Date(complaint.resolvedAt!).getTime();
          return sum + (resolved - created);
        }, 0);
        avgResolutionTimeHours = totalTime / resolvedWithTime.length / (1000 * 60 * 60); // Convert to hours
      }

      // Aggregate by department
      const complaintsByDepartment: { [key: string]: number } = {};
      complaints.forEach((complaint: Complaint) => {
        if (complaint.departmentId) {
          const dept = departments.find((d: any) => d.id === complaint.departmentId);
          const deptName = dept ? dept.name : 'Unknown';
          complaintsByDepartment[deptName] = (complaintsByDepartment[deptName] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      const topIssues = Object.entries(complaintsByDepartment)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count); // Show all departments

      // Aggregate by ward
      const complaintsByWard: { [key: string]: number } = {};
      complaints.forEach((complaint: Complaint) => {
        if (complaint.wardId) {
          const ward = wards.find((w: any) => w.id === complaint.wardId);
          const wardName = ward ? ward.name : `Ward ${complaint.wardId}`;
          complaintsByWard[wardName] = (complaintsByWard[wardName] || 0) + 1;
        }
      });

      // Convert to array with ward info
      const complaintsByWardArray = Object.entries(complaintsByWard)
        .map(([wardName, count]) => {
          const ward = wards.find((w: any) => w.name === wardName);
          return {
            wardId: ward ? ward.id : null,
            wardName,
            count,
            coordinates: ward ? ward.coordinates : undefined
          };
        })
        .sort((a, b) => b.count - a.count);

      // Prepare response data (no PII)
      data = {
        totalComplaints,
        resolvedRatio: Math.round(resolvedRatio * 10) / 10, // Round to 1 decimal
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10, // Round to 1 decimal
        topIssues,
        complaintsByWard: complaintsByWardArray,
        lastUpdated: new Date().toISOString()
      };

      // Cache the data
      transparencyCache.set(cacheKey, data);
    }

    // Add cache headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(data);

  } catch (error) {
    console.error('Error fetching transparency data:', error);
    res.status(500).json({ error: 'Failed to fetch transparency data' });
  }
};

export const getTransparencyCSV = async (req: Request, res: Response) => {
  try {
    // Get the transparency data
    const cacheKey = 'transparency-data';
    let data = transparencyCache.get<TransparencyData>(cacheKey);
    
    if (!data) {
      // Generate fresh data if not cached
      await getTransparencyData(req, res);
      data = transparencyCache.get<TransparencyData>(cacheKey);
    }
    
    if (!data) {
      throw new Error('Failed to generate transparency data');
    }

    // Generate CSV content
    const csvHeaders = ['Metric', 'Value', 'Category'];
    const csvRows = [
      ['Total Complaints', data.totalComplaints.toString(), 'Overview'],
      ['Resolved Ratio (%)', data.resolvedRatio.toString(), 'Overview'],
      ['Avg Resolution Time (Hours)', data.avgResolutionTimeHours.toString(), 'Overview'],
      ...data.topIssues.map((issue) => [issue.department, issue.count.toString(), 'Top Issues']),
      ...data.complaintsByWard.map((ward) => [ward.wardName, ward.count.toString(), 'By Ward'])
    ];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transparency-data-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};
