import { Router } from 'express';
import { getWards, getDepartments } from '../controllers/utilityController';

const router = Router();

// GET /api/wards - Get all wards
router.get('/wards', getWards);

// GET /api/departments - Get all departments  
router.get('/departments', getDepartments);

export default router;
