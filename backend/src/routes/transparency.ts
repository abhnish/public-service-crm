import { Router } from 'express';
import { getTransparencyData, getTransparencyCSV } from '../controllers/transparencyController';

const router = Router();

// Get transparency data (public endpoint - no auth required)
router.get('/', getTransparencyData);

// Export transparency data as CSV (public endpoint - no auth required)
router.get('/csv', getTransparencyCSV);

export default router;
