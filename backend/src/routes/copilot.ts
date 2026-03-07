import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { analyzeWithCopilot, loadComplaintsData } from '../controllers/copilotController';

const router = Router();

// Simple auth middleware for temporary auth system
const requireAdmin = (req: any, res: any, next: any) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// POST /api/admin/copilot - Analyze municipal data with AI copilot
router.post('/admin/copilot', requireAdmin, loadComplaintsData, analyzeWithCopilot);

export default router;
