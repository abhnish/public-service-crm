import { Request, Response } from 'express';

// Get all wards
export const getWards = async (req: Request, res: Response) => {
  try {
    // Load real wards data from JSON file
    const wardsData = require('../../data/wards.json');
    const wards = wardsData.map((ward: any) => ({
      id: ward.id,
      name: ward.name,
      geojson: ward.coordinates || {}
    }));

    res.json(wards);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
};

// Get all departments
export const getDepartments = async (req: Request, res: Response) => {
  try {
    // Load real departments data from JSON file
    const departmentsData = require('../../data/departments.json');
    const departments = departmentsData.map((dept: any) => ({
      id: dept.id,
      name: dept.name,
      slaHours: dept.slaHours || 24 // Default SLA if not specified
    }));

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};
