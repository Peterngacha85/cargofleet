import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { DriverLocationUpdate } from '@/types/map';
import MarkerPopup from './MarkerPopup';

export interface MapFocusRequest {
  driverId: string;
  token: number;
}

// Lives inside <MapContainer> so it can reach the underlying Leaflet map instance via
// useMap() and imperatively fly to a marker - markers/focusRequest are plain props/state,
// which can't drive that on their own since MapContainer only reads `center`/`zoom` once.
function FlyToMarker({
  markers,
  focusRequest,
}: {
  markers: DriverLocationUpdate[];
  focusRequest?: MapFocusRequest | null;
}) {
  const map = useMap();
  const handledTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (!focusRequest || handledTokenRef.current === focusRequest.token) return;
    const marker = markers.find((m) => m.driverId === focusRequest.driverId);
    if (marker) {
      map.flyTo([marker.latitude, marker.longitude], 15, { duration: 1 });
      handledTokenRef.current = focusRequest.token;
    }
    // If the marker isn't there yet (driver hasn't sent a location since we started
    // watching for it), leave the token unhandled - this effect re-runs on every
    // `markers` update, so it'll fly in as soon as that driver's location arrives.
  }, [focusRequest, markers, map]);

  return null;
}

export type MarkerColor = 'green' | 'red';

const markerHex: Record<MarkerColor, string> = {
  green: '#A3E635',
  red: '#EF4444',
};

// Material Design's "directions_car" glyph (viewBox 0 0 24 24) - simple enough to read at
// marker size, unlike a full truck illustration.
const CAR_ICON_PATH =
  'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z';

function vehicleIconHtml(colorHex: string) {
  return `<div style="width:28px;height:28px;border-radius:8px;background:${colorHex};border:2px solid #1F2937;box-shadow:0 1px 3px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#1F2937"><path d="${CAR_ICON_PATH}"/></svg>
  </div>`;
}

const driverIcons: Record<MarkerColor, L.DivIcon> = {
  green: L.divIcon({
    className: '',
    html: vehicleIconHtml(markerHex.green),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }),
  red: L.divIcon({
    className: '',
    html: vehicleIconHtml(markerHex.red),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
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
  // Set to fly/zoom the map to a specific driver's marker (e.g. from a "Show on Map" button).
  focusRequest?: MapFocusRequest | null;
}

export default function MapComponent({
  markers = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  labelFor,
  markerColorFor,
  focusRequest,
}: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToMarker markers={markers} focusRequest={focusRequest} />
      {markers.map((m) => (
        <Marker
          key={m.driverId}
          position={[m.latitude, m.longitude]}
          icon={driverIcons[markerColorFor?.(m.driverId) ?? 'green']}
        >
          <Popup>
            <MarkerPopup
              driverName={labelFor?.(m.driverId) ?? m.driverId}
              latitude={m.latitude}
              longitude={m.longitude}
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
