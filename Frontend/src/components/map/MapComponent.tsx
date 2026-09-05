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
