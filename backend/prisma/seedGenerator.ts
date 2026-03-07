import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

// Types for our data structures
interface Complaint {
  id: number;
  citizenId: number;
  wardId: number;
  departmentId: number;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  sentiment: string;
  priorityScore: number;
  status: 'submitted' | 'in_progress' | 'resolved' | 'escalated';
  assignedOfficer?: number;
  attachments?: string[] | null;
  createdAt: string;
  assignedAt?: string | null;
  resolvedAt?: string | null;
}

interface Ward {
  id: number;
  name: string;
  area: string;
  population: number;
  coordinates: {
    lat: number;
    lng: number;
    bounds: [[number, number], [number, number]];
  };
}

interface Department {
  id: number;
  name: string;
  description: string;
}

// Configuration
const TOTAL_COMPLAINTS = 200;
const STATUS_DISTRIBUTION = {
  submitted: 50,
  in_progress: 40,
  resolved: 80,
  escalated: 30
};

// Base coordinates (Delhi area)
const BASE_LAT = 28.6139;
const BASE_LNG = 77.2090;
const COORDINATE_RANGE = 0.05; // ~5km range

// Sample data
const wards: Ward[] = [
  { id: 1, name: 'Central Ward', area: 'Downtown District', population: 50000, coordinates: { lat: 28.6139, lng: 77.2090, bounds: [[28.6039, 77.1990], [28.6239, 77.2190]] }},
  { id: 2, name: 'North Ward', area: 'Northern District', population: 45000, coordinates: { lat: 28.6239, lng: 77.2090, bounds: [[28.6139, 77.1990], [28.6339, 77.2190]] }},
  { id: 3, name: 'South Ward', area: 'Southern District', population: 38000, coordinates: { lat: 28.6039, lng: 77.2190, bounds: [[28.5939, 77.2090], [28.6139, 77.2290]] }},
  { id: 4, name: 'East Ward', area: 'Eastern District', population: 42000, coordinates: { lat: 28.6139, lng: 77.2290, bounds: [[28.6039, 77.2190], [28.6239, 77.2390]] }},
  { id: 5, name: 'West Ward', area: 'Western District', population: 35000, coordinates: { lat: 28.6139, lng: 77.1990, bounds: [[28.6039, 77.1890], [28.6239, 77.2090]] }}
];

const departments: Department[] = [
  { id: 1, name: 'Water Supply', description: 'Water supply and sanitation issues' },
  { id: 2, name: 'Road Damage', description: 'Road maintenance and infrastructure' },
  { id: 3, name: 'Sanitation', description: 'Waste management and cleanliness' },
  { id: 4, name: 'Electricity', description: 'Power supply and electrical issues' },
  { id: 5, name: 'Street Lighting', description: 'Street light maintenance' },
  { id: 6, name: 'Drainage', description: 'Drainage and flood control' }
];

const complaintCategories = [
  'Water Supply', 'Road Damage', 'Sanitation', 'Electricity', 
  'Street Lighting', 'Drainage', 'Noise Pollution', 'Illegal Construction',
  'Tree Maintenance', 'Public Safety', 'Traffic Management', 'Waste Collection'
];

const sentiments = ['positive', 'neutral', 'negative'];

const complaintTemplates = {
  'Water Supply': [
    'No water supply in {location} for the past 2 days',
    'Low water pressure in {location} affecting residents',
    'Contaminated water coming from taps in {location}',
    'Water pipeline leakage in {location} needs immediate attention',
    'Irregular water supply timing in {location}'
  ],
  'Road Damage': [
    'Large pothole on main road in {location} causing accidents',
    'Road completely damaged in {location} due to heavy rain',
    'Street lights not working on road in {location}',
    'Road repair needed urgently in {location}',
    'Traffic congestion due to road damage in {location}'
  ],
  'Sanitation': [
    'Garbage not collected in {location} for over a week',
    'Overflowing dustbins in {location} causing health issues',
    'Illegal dumping of waste in {location}',
    'Public toilets in {location} not maintained properly',
    'Sewage blockage in {location} needs immediate cleaning'
  ],
  'Electricity': [
    'Frequent power cuts in {location} affecting daily life',
    'Electric pole damaged in {location} posing safety risk',
    'Street lights not working in {location} since last week',
    'Low voltage issues in {location}',
    'Electric wiring exposed in {location} - dangerous for residents'
  ],
  'Street Lighting': [
    'All street lights not working in {location}',
    'Dim street lights in {location} causing safety concerns',
    'Street light pole fallen in {location}',
    'Lights flickering continuously in {location}',
    'No street lights on main road in {location}'
  ],
  'Drainage': [
    'Drainage blocked in {location} causing water logging',
    'Manhole cover missing in {location} - dangerous',
    'Drainage overflow in {location} during rains',
    'Sewage water coming out of drains in {location}',
    'Drainage system needs repair in {location}'
  ]
};

// Utility functions
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomCoordinates(ward: Ward): { latitude: number; longitude: number } {
  const { lat, lng, bounds } = ward.coordinates;
  const latRange = bounds[1][0] - bounds[0][0];
  const lngRange = bounds[1][1] - bounds[0][1];
  
  return {
    latitude: bounds[0][0] + Math.random() * latRange,
    longitude: bounds[0][1] + Math.random() * lngRange
  };
}

function generateComplaintDescription(category: string, location: string): string {
  const templates = complaintTemplates[category as keyof typeof complaintTemplates] || [
    'Issue reported in {location} regarding {category}',
    'Problem with {category} in {location} needs attention',
    '{category} issue affecting residents in {location}'
  ];
  
  const template = getRandomItem(templates);
  return template.replace('{location}', location).replace('{category}', category);
}

function generateRandomDate(daysBack: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
}

function generateResolvedDate(createdDate: string): string {
  const created = new Date(createdDate);
  const resolved = new Date(created);
  resolved.setDate(resolved.getDate() + getRandomNumber(1, 14)); // 1-14 days to resolve
  return resolved.toISOString();
}

// Main generator function
function generateComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  let complaintId = 1;

  // Generate complaints for each status according to distribution
  Object.entries(STATUS_DISTRIBUTION).forEach(([status, count]) => {
    for (let i = 0; i < count; i++) {
      const ward = getRandomItem(wards);
      const department = getRandomItem(departments);
      const category = getRandomItem(complaintCategories);
      const coordinates = getRandomCoordinates(ward);
      const createdAt = generateRandomDate(30);
      
      const complaint: Complaint = {
        id: complaintId++,
        citizenId: getRandomNumber(1, 100), // Random citizen ID
        wardId: ward.id,
        departmentId: department.id,
        description: generateComplaintDescription(category, ward.name),
        location: `${faker.location.streetAddress()}, ${ward.name}`,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        category,
        sentiment: getRandomItem(sentiments),
        priorityScore: getRandomFloat(0.1, 1.0, 2),
        status: status as any,
        assignedOfficer: status !== 'submitted' ? getRandomNumber(1, 10) : undefined,
        attachments: Math.random() > 0.7 ? [`attachment_${complaintId}.jpg`] : null,
        createdAt,
        assignedAt: status !== 'submitted' ? new Date(new Date(createdAt).getTime() + getRandomNumber(1, 3) * 24 * 60 * 60 * 1000).toISOString() : null,
        resolvedAt: status === 'resolved' ? generateResolvedDate(createdAt) : null
      };

      complaints.push(complaint);
    }
  });

  // Shuffle complaints to mix them up
  return complaints.sort(() => Math.random() - 0.5);
}

// Save data to files
function saveDataToFile(data: any, filename: string): void {
  const filePath = path.join(__dirname, '..', 'data', filename);
  const dirPath = path.dirname(filePath);
  
  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Generated ${filename} with ${data.length || Object.keys(data).length} items`);
}

// Main execution
function main() {
  console.log('🌱 Starting seed data generation...\n');
  
  // Generate complaints
  const complaints = generateComplaints();
  
  // Create data structure
  const dataToSave = {
    complaints,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalComplaints: complaints.length,
      statusDistribution: STATUS_DISTRIBUTION,
      wards: wards.length,
      departments: departments.length
    }
  };
  
  // Save to file
  saveDataToFile(dataToSave, 'complaints.json');
  
  // Print statistics
  console.log('\n📊 Generation Statistics:');
  console.log(`Total Complaints: ${complaints.length}`);
  
  Object.entries(STATUS_DISTRIBUTION).forEach(([status, count]) => {
    const actualCount = complaints.filter(c => c.status === status).length;
    console.log(`${status.toUpperCase()}: ${actualCount} (expected: ${count})`);
  });
  
  console.log('\n🏗️ Ward Distribution:');
  wards.forEach(ward => {
    const count = complaints.filter(c => c.wardId === ward.id).length;
    console.log(`${ward.name}: ${count} complaints`);
  });
  
  console.log('\n🏢 Department Distribution:');
  departments.forEach(dept => {
    const count = complaints.filter(c => c.departmentId === dept.id).length;
    console.log(`${dept.name}: ${count} complaints`);
  });
  
  console.log('\n✅ Seed data generation completed successfully!');
  console.log('📁 File saved to: backend/data/complaints.json');
}

// Run the generator
if (require.main === module) {
  main();
}

export { generateComplaints, saveDataToFile };
