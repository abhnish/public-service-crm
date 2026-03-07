import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLng, Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { utilityAPI } from '../services/api';

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface Complaint {
  id: number;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  status: string;
  priorityScore: number;
  createdAt: string;
  wardId?: number;
  departmentId?: number;
  citizenId?: number;
}

interface ComplaintMapProps {
  complaints: Complaint[];
  onComplaintClick?: (complaint: Complaint) => void;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    departmentIds?: number[];
    status?: string;
    minPriority?: number;
  };
}

// Generate seed coordinates for complaints without lat/lng (cached for stability)
const coordinateCache = new Map<number, { lat: number; lng: number }>();

// Real ward coordinates from API
const realWardCoordinates: { [key: number]: { lat: number; lng: number } } = {
  1: { lat: 28.6139, lng: 77.2090 },  // Central Ward
  2: { lat: 28.6239, lng: 77.2090 },  // North Ward
  3: { lat: 28.6039, lng: 77.2190 },  // South Ward
  4: { lat: 28.6139, lng: 77.2290 },  // East Ward
  5: { lat: 28.6139, lng: 77.1990 },  // West Ward
};

const generateSeedCoordinates = (complaint: Complaint): { lat: number; lng: number } => {
  // Use complaint ID for stable caching
  if (coordinateCache.has(complaint.id)) {
    return coordinateCache.get(complaint.id)!;
  }

  // Use real ward coordinates
  const base = realWardCoordinates[complaint.wardId || 1];
  
  // Use complaint ID for consistent random offset within ward bounds
  const randomOffset = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return (x - Math.floor(x)) * 0.01 - 0.005; // -0.005 to 0.005 range (smaller area)
  };

  const coords = {
    lat: base.lat + randomOffset(complaint.id),
    lng: base.lng + randomOffset(complaint.id + 1000)
  };

  coordinateCache.set(complaint.id, coords);
  return coords;
};

const ComplaintMap: React.FC<ComplaintMapProps> = ({ 
  complaints, 
  onComplaintClick,
  filters 
}) => {
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>(complaints);

  // Apply filters
  useEffect(() => {
    let filtered = [...complaints];

    if (filters?.dateFrom) {
      filtered = filtered.filter(c => 
        new Date(c.createdAt) >= new Date(filters.dateFrom!)
      );
    }

    if (filters?.dateTo) {
      filtered = filtered.filter(c => 
        new Date(c.createdAt) <= new Date(filters.dateTo!)
      );
    }

    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      filtered = filtered.filter(c => 
        c.departmentId && filters.departmentIds!.includes(c.departmentId)
      );
    }

    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters?.minPriority !== undefined) {
      filtered = filtered.filter(c => c.priorityScore >= filters.minPriority!);
    }

    setFilteredComplaints(filtered);
  }, [complaints, filters]);

  // Create custom icon based on priority (memoized for stability)
  const createCustomIcon = useMemo(() => (priorityScore: number): DivIcon => {
    const color = priorityScore >= 0.8 ? 'red' : 
                 priorityScore >= 0.6 ? 'orange' : 
                 priorityScore >= 0.4 ? 'yellow' : 'green';

    return new DivIcon({
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">${Math.round(priorityScore * 10)}</div>`,
      className: 'custom-marker',
      iconSize: [20, 20] as [number, number],
      iconAnchor: [10, 10] as [number, number],
    });
  }, []);

  // Prepare markers with coordinates (memoized for stability)
  const markers = useMemo(() => {
    return filteredComplaints.map(complaint => {
      let lat = complaint.latitude;
      let lng = complaint.longitude;

      // Generate seed coordinates if missing (cached for stability)
      if (!lat || !lng) {
        const coords = generateSeedCoordinates(complaint);
        lat = coords.lat;
        lng = coords.lng;
      }

      return {
        ...complaint,
        latitude: lat,
        longitude: lng
      };
    });
  }, [filteredComplaints]);

  // Stable click handler
  const handleMarkerClick = useCallback((complaint: Complaint) => {
    if (onComplaintClick) {
      onComplaintClick(complaint);
    }
  }, [onComplaintClick]);

  // Default center (Bangalore) and fixed zoom for stability
  const defaultCenter: LatLng = new LatLng(12.9716, 77.5946);
  const defaultZoom = 12;

  return (
    <div className="w-full h-full">
      <MapContainer
        key="complaint-map"
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '500px', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Removed MapBounds to prevent erratic behavior */}
        
        {markers.map((complaint) => (
          <Marker
            key={`${complaint.id}-${complaint.latitude}-${complaint.longitude}`}
            position={[complaint.latitude, complaint.longitude]}
            icon={createCustomIcon(complaint.priorityScore)}
            eventHandlers={{
              click: () => handleMarkerClick(complaint)
            }}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <div className="font-semibold text-sm mb-1">
                  {complaint.category}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {complaint.description.substring(0, 100)}
                  {complaint.description.length > 100 ? '...' : ''}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <span className="font-semibold">
                      {(complaint.priorityScore * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span className="text-gray-600">
                      {complaint.location}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span className="text-gray-600">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onComplaintClick) {
                      onComplaintClick(complaint);
                    }
                  }}
                  className="mt-2 w-full bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="text-gray-500 mb-2">No complaints found</div>
            <div className="text-sm text-gray-400">
              Try adjusting your filters or check back later
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintMap;
