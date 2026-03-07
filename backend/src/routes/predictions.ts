import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getPredictions, loadComplaintsData } from '../controllers/predictionController';

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

// GET /api/admin/predictions - Get complaint predictions
router.get('/admin/predictions', requireAdmin, loadComplaintsData, getPredictions);

export default router;
