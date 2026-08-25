import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../utils/cn';
import { formatRelativeTime } from '../../utils/format';
import EmptyState from '../ui/EmptyState';
import { Radio } from 'lucide-react';

const STATUS_COLORS = {
  ACTIVE: '#16a34a',
  MAINTENANCE: '#f59e0b',
  BREAKDOWN: '#dc2626',
  RETIRED: '#64748b',
};

function makePin(status, isSelected) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.RETIRED;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative"><div style="width:14px;height:14px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)${isSelected ? ';outline:3px solid rgba(37,99,235,.45)' : ''}"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 16],
    popupAnchor: [0, -14],
  });
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    if (points.length === 1) {
      const [lat, lng] = [Number(points[0].latitude), Number(points[0].longitude)];
      map.setView([lat, lng], 13);
    } else {
      const positions = points.map((p) => [Number(p.latitude), Number(p.longitude)]);
      map.fitBounds(L.latLngBounds(positions).pad(0.25));
    }
  }, [points, map]);

  return null;
}

export default function FleetMap({ points = [], height = '420px', selectedId = null, onSelect }) {
  const validPoints = points.filter(
    (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
  );

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom
        style={{ height }}
        className="rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={validPoints} />
        {validPoints.map((point) => (
          <Marker
            key={point.vehicleId}
            position={[Number(point.latitude), Number(point.longitude)]}
            icon={makePin(point.status, point.vehicleId === selectedId)}
            eventHandlers={{
              click: () => onSelect?.(point.vehicleId),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[160px]">
                <p className="font-semibold text-sm text-slate-800">{point.registrationNo}</p>
                <p className="text-xs capitalize">{point.status}</p>
                <p className="text-xs text-slate-500">
                  {Math.round(Number(point.speedKmh))} km/h
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatRelativeTime(point.recordedAt)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {!validPoints.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] z-[500] pointer-events-none">
          <EmptyState icon={Radio} message="No vehicles reporting" />
        </div>
      )}
    </div>
  );
}
