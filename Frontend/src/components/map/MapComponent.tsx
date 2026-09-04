import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { DriverLocationUpdate } from '@/types/map';
import MarkerPopup from './MarkerPopup';

export type MarkerColor = 'green' | 'red';

const markerHex: Record<MarkerColor, string> = {
  green: '#A3E635',
  red: '#EF4444',
};

const driverIcons: Record<MarkerColor, L.DivIcon> = {
  green: L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${markerHex.green};border:2px solid #1F2937;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  }),
  red: L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${markerHex.red};border:2px solid #1F2937;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  }),
};

interface MapComponentProps {
  markers?: DriverLocationUpdate[];
  center?: [number, number];
  zoom?: number;
  labelFor?: (driverId: string) => string;
  // Omit for a single-color map (e.g. a driver's own location); provide to color-code
  // markers per driver (e.g. a manager's own branch vs. others).
  markerColorFor?: (driverId: string) => MarkerColor;
}

export default function MapComponent({
  markers = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  labelFor,
  markerColorFor,
}: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.driverId}
          position={[m.latitude, m.longitude]}
          icon={driverIcons[markerColorFor?.(m.driverId) ?? 'green']}
        >
          <Popup>
            <MarkerPopup
              driverName={labelFor?.(m.driverId) ?? m.driverId}
              speed={m.speed}
              lastUpdated={m.timestamp}
              tripNumber={m.tripNumber}
              dropoffAddress={m.dropoffAddress}
              tripStatus={m.tripStatus}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
