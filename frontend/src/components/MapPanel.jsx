import { useState } from "react";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";

export default function NZMapPanel({ onPick }) {
  const center = [-41.3, 174.7]; // NZ
  const zoom = 5;

  // Show hint on load, hide after first interaction
  const [showHint, setShowHint] = useState(true);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setShowHint(false);
        onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
      zoomstart() { setShowHint(false); },
      movestart() { setShowHint(false); },
      dragstart() { setShowHint(false); },
      wheel()     { setShowHint(false); },
    });
    return null;
  }

  return (
    <div className="card h-100">
      <div className="card-header pb-2">
        <h5 className="card-title d-flex align-items-center gap-2 mb-0">
          <MapPin size={18} className="me-2" />
          World Map (click to select)
        </h5>
      </div>
      <div className="card-body map-body">
        <MapContainer center={center} zoom={zoom} className="map-container">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
          <MapClickHandler />
        </MapContainer>

        {/* grid overlay */}
        <svg className="position-absolute top-0 start-0 w-100 h-100 grid-overlay" 
        xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbe5f1" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {showHint && (
          <div 
          className="map-hint text-secondary small"
          >
            (Click to get latitude/longitude)
          </div>
        )}
      </div>
    </div>
  );
}