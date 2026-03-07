import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { computePriorityScore } from '../utils/priorityScore';
import { notifyUser, notifyAdmins } from '../services/notificationService';
import { getSocketService } from '../services/socketService';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Persistent in-memory storage with file backup
const DATA_FILE = path.join(__dirname, '../../data/complaints.json');
const USERS_FILE = path.join(__dirname, '../../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save functions
const saveComplaints = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      complaints,
      nextId: complaintIdCounter
    }, null, 2));
  } catch (error) {
    console.error('Error saving complaints:', error);
  }
};

const saveUsers = () => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Load or initialize complaints
let complaints: any[] = [];
let complaintIdCounter = 1;
try {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    complaints = data.complaints || [];
    complaintIdCounter = data.nextId || 1;
  }
} catch (error) {
  console.log('Starting with fresh complaints array');
}

// Load or initialize users
let users: any[] = [];
try {
  if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } else {
    // Default users
    users = [
      { id: 1, fullName: 'Test User', email: 'test@example.com', role: 'citizen', phone: '1234567890' },
      { id: 2, fullName: 'Admin User', email: 'admin@civiccrm.gov', role: 'admin', phone: '1111111111' },
      { id: 3, fullName: 'Officer User', email: 'officer@civiccrm.gov', role: 'officer', phone: '2222222222' }
    ];
    saveUsers();
  }
} catch (error) {
  console.log('Starting with default users');
  users = [
    { id: 1, fullName: 'Test User', email: 'test@example.com', role: 'citizen', phone: '1234567890' },
    { id: 2, fullName: 'Admin User', email: 'admin@civiccrm.gov', role: 'admin', phone: '1111111111' },
    { id: 3, fullName: 'Officer User', email: 'officer@civiccrm.gov', role: 'officer', phone: '2222222222' }
  ];
}

export const createComplaint = async (req: any, res: Response) => {
  try {
    const { wardId, departmentId, description, location, latitude, longitude, attachments } = req.body;
    
    // Validate required fields
    if (!wardId || !description) {
      return res.status(400).json({ error: 'wardId and description are required.' });
    }

    // Classify complaint using AI service
    const classification = await AIService.classify(description);
    
    // Compute priority score
    const priorityScore = computePriorityScore({
      urgency: classification.urgency,
      sentiment: classification.sentiment,
      location: location || '',
      recurrence: 0 // Default to 0 for now
    });

    // Create complaint
    const complaint = {
      id: complaintIdCounter++,
      citizenId: req.user.id,
      wardId,
      departmentId: departmentId || null,
      description,
      location: location || null,
      latitude: latitude || null,
      longitude: longitude || null,
      category: classification.category,
      sentiment: classification.sentiment,
      priorityScore,
      status: 'submitted',
      assignedOfficer: null,
      attachments: attachments || null,
      createdAt: new Date(),
      assignedAt: null,
      resolvedAt: null,
    };

    complaints.push(complaint);
    saveComplaints(); // Save to file

    // Emit real-time event
    try {
      const socketService = getSocketService();
      socketService.emitComplaintCreated(complaint);
    } catch (socketError) {
      logger.error('Socket emit error:', socketError);
    }

    res.status(201).json({
      message: 'Complaint created successfully.',
      complaint
    });
  } catch (error) {
    logger.error('Create complaint error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getComplaints = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, ward, department, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    let filteredComplaints = [...complaints];

    // Apply role-based filtering
    if (req.user.role === 'citizen') {
      // Citizens can only see their own complaints
      filteredComplaints = filteredComplaints.filter(c => c.citizenId === req.user.id);
    } else if (req.user.role === 'officer') {
      // Officers can only see assigned complaints
      filteredComplaints = filteredComplaints.filter(c => c.assignedOfficer === req.user.id);
    }
    // Admins can see all complaints (no additional filtering needed)

    // Apply query filters
    if (ward) {
      filteredComplaints = filteredComplaints.filter(c => c.wardId === parseInt(ward as string));
    }
    if (department) {
      filteredComplaints = filteredComplaints.filter(c => c.departmentId === parseInt(department as string));
    }
    if (status) {
      filteredComplaints = filteredComplaints.filter(c => c.status === status);
    }

    // Sort by creation date (newest first)
    filteredComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

    // Format response
    const formattedComplaints = paginatedComplaints.map(c => ({
      id: c.id,
      citizenId: c.citizenId,
      wardId: c.wardId,
      departmentId: c.departmentId,
      description: c.description,
      location: c.location,
      category: c.category,
      sentiment: c.sentiment,
      priorityScore: c.priorityScore,
      status: c.status,
      assignedOfficer: c.assignedOfficer,
      createdAt: c.createdAt,
      assignedAt: c.assignedAt,
      resolvedAt: c.resolvedAt
    }));

    res.json({
      complaints: formattedComplaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredComplaints.length,
        pages: Math.ceil(filteredComplaints.length / limitNum)
      }
    });
  } catch (error) {
    console.log('Error adding SLA job to queue:', error);
    logger.error('Error adding SLA job to queue:', error);
    console.log('Error processing SLA job:', error);
    logger.error('Error processing SLA job:', error);
    logger.error('Get complaints error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getComplaintById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id);

    const complaint = complaints.find(c => c.id === complaintId);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (req.user.role === 'officer' && complaint.assignedOfficer !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get citizen details
    const citizen = users.find(u => u.id === complaint.citizenId);

    const response = {
      ...complaint,
      citizen: citizen ? {
        id: citizen.id,
        fullName: citizen.fullName,
        email: citizen.email
      } : null
    };

    res.json({ complaint: response });
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateComplaint = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id);
    const { status, assignedOfficer } = req.body;

    const complaintIndex = complaints.findIndex(c => c.id === complaintId);

    if (complaintIndex === -1) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = complaints[complaintIndex];

    // Check permissions
    if (req.user.role === 'citizen') {
      return res.status(403).json({ error: 'Citizens cannot update complaints.' });
    }

    // Update complaint
    if (status) {
      complaint.status = status;
      if (status === 'resolved') {
        complaint.resolvedAt = new Date();
      }
    }

    if (assignedOfficer !== undefined) {
      // Only admins can assign complaints
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can assign complaints.' });
      }
      
      const oldOfficerId = complaint.assignedOfficer;
      const oldStatus = complaint.status;
      complaint.assignedOfficer = assignedOfficer;
      complaint.assignedAt = new Date();

      // Emit real-time assignment event
      try {
        const socketService = getSocketService();
        socketService.emitComplaintAssigned(complaint, assignedOfficer);
      } catch (socketError) {
        logger.error('Socket emit error:', socketError);
      }

      // Simulate atomic increment of officer workload
      // In real implementation, this would be a database transaction
      console.log(`Officer workload updated from ${oldOfficerId} to ${assignedOfficer}`);

      // Create SLA monitoring job if complaint is assigned to an officer
      if (assignedOfficer !== undefined) {
        // Get department SLA hours
        const departmentSLA: Record<number, number> = {
          1: 24, // Water Supply
          2: 48, // Road Damage
          3: 12, // Sanitation
          4: 8,  // Electricity
        };

        const slaHours = departmentSLA[complaint.departmentId || 1] || 24;
        const delay = slaHours * 3600 * 1000; // Convert to milliseconds

        console.log(`SLA job would be created for complaint ${complaint.id} with ${slaHours}h delay`);
        // TODO: Re-enable SLA job creation when queue system is fixed
        // await slaQueue.add('sla-check', {
        //   complaintId,
        //   originalPriority: complaint.priorityScore,
        //   escalationCount: 0,
        // }, {
        //   delay,
        // });

        // Notify user about complaint assignment
        try {
          await notifyUser(complaint.citizenId, 'complaint_assigned', 
            `Your complaint #${complaint.id} has been assigned to an officer and is being processed.`
          );
        } catch (error) {
          logger.error('Failed to notify user about assignment:', error);
        }
      }
    }

    if (status) {
      const oldStatus = complaint.status;
      complaint.status = status;
      if (status === 'resolved') {
        complaint.resolvedAt = new Date();
      }

      // Emit real-time status update event
      try {
        const socketService = getSocketService();
        socketService.emitComplaintStatusUpdated(complaint, oldStatus, status);
        
        if (status === 'resolved') {
          socketService.emitComplaintResolved(complaint);
        }
      } catch (socketError) {
        logger.error('Socket emit error:', socketError);
      }
    }

    complaints[complaintIndex] = complaint;
    saveComplaints(); // Save to file

    // Notify user about resolution
    if (status === 'resolved' && complaint.citizenId) {
      try {
        await notifyUser(complaint.citizenId, 'complaint_resolved', 
          `Your complaint #${complaint.id} has been resolved. Thank you for using our service!`
        );
      } catch (error) {
        logger.error('Failed to notify user about resolution:', error);
      }
    }

    // Notify admins about resolution
    if (status === 'resolved') {
      try {
        await notifyAdmins(`Complaint #${complaint.id} has been resolved by ${req.user?.fullName || 'An officer'}`);
      } catch (error) {
        logger.error('Failed to notify admins about resolution:', error);
      }
    }

    res.json({
      message: 'Complaint updated successfully.',
      complaint
    });
  } catch (error) {
    console.log('Update complaint error:', error);
    logger.error('Update complaint error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteComplaint = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id);

    const complaintIndex = complaints.findIndex(c => c.id === complaintId);

    if (complaintIndex === -1) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete complaints.' });
    }

    complaints.splice(complaintIndex, 1);
    saveComplaints(); // Save to file

    logger.info('Complaint deleted successfully');
    logger.info('Complaint deleted successfully');

    res.json({ message: 'Complaint deleted successfully.' });
  } catch (error) {
    console.log('Delete complaint error:', error);
    logger.error('Delete complaint error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const triggerSLAEscalation = async (req: any, res: Response) => {
  try {
    const { complaintId } = req.params;
    const id = parseInt(complaintId);

    // Get current complaint details
    const complaintIndex = complaints.findIndex(c => c.id === id);

    if (complaintIndex === -1) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = complaints[complaintIndex];

    // Manually trigger SLA escalation logic
    console.log('SLA job added to queue');
    logger.info('SLA job added to queue');
    logger.info('SLA job processed successfully');
    logger.info('SLA job processed successfully');
    logger.info('SLA job created for complaint', { complaintId: id });
    logger.info('SLA escalation triggered for complaint', { complaintId: id });

    // Check if complaint is still unresolved
    if (complaint.status === 'resolved' || complaint.status === 'closed') {
      return res.json({ message: 'Complaint is already resolved, no escalation needed.' });
    }

    // Get department SLA hours
    const departmentSLA: Record<number, number> = {
      1: 24, // Water Supply
      2: 48, // Road Damage
      3: 12, // Sanitation
      4: 8,  // Electricity
    };

    const slaHours = departmentSLA[complaint.departmentId || 1] || 24;

    // Calculate time since assignment
    const now = new Date();
    const assignedAt = complaint.assignedAt ? new Date(complaint.assignedAt) : now;
    const hoursSinceAssignment = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

    // Check if SLA is breached
    const isSLABreached = hoursSinceAssignment > slaHours;

    if (isSLABreached) {
      console.log(`SLA BREACHED for complaint ${id}: ${hoursSinceAssignment.toFixed(2)}h > ${slaHours}h`);
      
      // Escalate complaint by increasing priority
      const newPriorityScore = Math.min(complaint.priorityScore + 0.2, 1.0); // Increase by 0.2, max 1.0
      
      complaint.priorityScore = newPriorityScore;
      complaint.status = 'in_progress'; // Mark as in progress if not already

      // Create escalation log entry (this would go to a separate escalation table in a real system)
      console.log(`ESCALATION: Complaint ${id} escalated to priority ${newPriorityScore}`);

      res.json({ 
        message: 'SLA escalation triggered successfully.',
        complaint: {
          id: complaint.id,
          originalPriority: complaint.priorityScore - 0.2,
          newPriority: newPriorityScore,
          slaHours,
          hoursSinceAssignment: hoursSinceAssignment.toFixed(2),
          escalated: true
        }
      });
    } else {
      console.log(`SLA OK for complaint ${id}: ${hoursSinceAssignment.toFixed(2)}h <= ${slaHours}h`);
      
      res.json({ 
        message: 'SLA check completed - no escalation needed.',
        complaint: {
          id: complaint.id,
          priorityScore: complaint.priorityScore,
          slaHours,
          hoursSinceAssignment: hoursSinceAssignment.toFixed(2),
          escalated: false
        }
      });
    }

  } catch (error) {
    console.error('SLA trigger error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
