import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface WardData {
  wardId: number | null;
  wardName: string;
  count: number;
  coordinates?: {
    lat: number;
    lng: number;
    bounds: [[number, number], [number, number]];
  };
}

interface TransparencyMapProps {
  complaintsByWard: WardData[];
}

// Fix for default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TransparencyMap: React.FC<TransparencyMapProps> = ({ complaintsByWard }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 11);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Rectangle || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Find max count for normalization
    const maxCount = Math.max(...complaintsByWard.map(w => w.count));

    // Add ward rectangles with heatmap colors
    complaintsByWard.forEach((ward) => {
      if (!ward.coordinates) return;

      const { lat, lng, bounds } = ward.coordinates;
      
      // Calculate color intensity based on complaint count
      const intensity = ward.count / maxCount;
      const color = getHeatmapColor(intensity);

      // Create rectangle for ward boundary
      const rectangle = L.rectangle(bounds, {
        color: color,
        weight: 2,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.6
      }).addTo(map);

      // Add popup with ward information
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #333;">${ward.wardName}</h4>
          <p style="margin: 4px 0; color: #666;">
            <strong>Complaints:</strong> ${ward.count}
          </p>
          <p style="margin: 4px 0; color: #666;">
            <strong>Percentage:</strong> ${((ward.count / complaintsByWard.reduce((sum, w) => sum + w.count, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      `;

      rectangle.bindPopup(popupContent);

      // Add circle marker at ward center
      const circle = L.circleMarker([lat, lng], {
        radius: Math.max(8, 20 * intensity),
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      circle.bindPopup(popupContent);
    });

  }, [complaintsByWard]);

  // Generate heatmap color based on intensity
  const getHeatmapColor = (intensity: number): string => {
    // Color gradient from green (low) to yellow (medium) to red (high)
    if (intensity < 0.33) {
      // Green to yellow
      const ratio = intensity / 0.33;
      return `rgb(${Math.round(255 * ratio)}, ${Math.round(255 * (1 - ratio * 0.5))}, 0)`;
    } else if (intensity < 0.66) {
      // Yellow to orange
      const ratio = (intensity - 0.33) / 0.33;
      return `rgb(255, ${Math.round(165 * (1 - ratio))}, 0)`;
    } else {
      // Orange to red
      const ratio = (intensity - 0.66) / 0.34;
      return `rgb(255, ${Math.round(165 * (1 - ratio))}, 0)`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Ward - Geographic Distribution</h2>
      <div 
        ref={mapRef} 
        className="h-96 w-full rounded-lg overflow-hidden border border-gray-200"
        style={{ minHeight: '400px' }}
      />
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="font-medium">Intensity Scale:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>High</span>
          </div>
        </div>
        <span className="text-xs">
          Click on wards for detailed information
        </span>
      </div>
    </div>
  );
};

export default TransparencyMap;
