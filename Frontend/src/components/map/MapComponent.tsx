import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { DriverLocationUpdate } from '@/types/map';
import MarkerPopup from './MarkerPopup';

const driverIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#A3E635;border:2px solid #1F2937;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface MapComponentProps {
  markers?: DriverLocationUpdate[];
  center?: [number, number];
  zoom?: number;
  labelFor?: (driverId: string) => string;
}

export default function MapComponent({
  markers = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  labelFor,
}: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker key={m.driverId} position={[m.latitude, m.longitude]} icon={driverIcon}>
          <Popup>
            <MarkerPopup driverName={labelFor?.(m.driverId) ?? m.driverId} speed={m.speed} lastUpdated={m.timestamp} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
