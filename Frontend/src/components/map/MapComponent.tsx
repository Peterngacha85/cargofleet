import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/utils/constants';
import { DriverLocationUpdate } from '@/types/map';
import { useMapPathStore } from '@/stores/mapPathStore';
import { LocationService } from '@/services/locationService';
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

// Auto-fits the view to whoever's currently sharing, so a driver miles from the default
// center isn't invisible off-screen. Keyed on the *set* of driver ids (not their coordinates)
// so it only re-fits when someone starts/stops sharing - not on every GPS tick, which would
// otherwise keep yanking the map away from a user who's trying to pan around.
function FitToMarkers({ markers }: { markers: DriverLocationUpdate[] }) {
  const map = useMap();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (markers.length === 0) return;
    const key = markers
      .map((m) => m.driverId)
      .sort()
      .join(',');
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 15);
    } else {
      const bounds = L.latLngBounds(markers.map((m): [number, number] => [m.latitude, m.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, map]);

  return null;
}

// Draws the route a driver has followed for one trip, fetched from that trip's recorded
// location history on demand (from the "Show Path" button in its popup) rather than for
// every marker up front, which would be wasteful for trips nobody's looking at.
function TripPath() {
  const pathRequest = useMapPathStore((s) => s.pathRequest);
  const [positions, setPositions] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!pathRequest) {
      setPositions([]);
      return;
    }

    let cancelled = false;
    LocationService.getTripHistory(pathRequest.tripId).then((res) => {
      if (cancelled) return;
      const points = (res.data?.history ?? []).map((p): [number, number] => [p.latitude, p.longitude]);
      setPositions(points);
    });

    return () => {
      cancelled = true;
    };
  }, [pathRequest]);

  if (positions.length < 2) return null;

  return <Polyline positions={positions} pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8 }} />;
}

// blue marks a driver from another branch whose current trip is heading to the viewer's own
// branch - "incoming", same blue as the recorded-route polyline drawn by TripPath below.
export type MarkerColor = 'green' | 'red' | 'blue';

const markerHex: Record<MarkerColor, string> = {
  green: '#A3E635',
  red: '#EF4444',
  blue: '#3B82F6',
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
  blue: L.divIcon({
    className: '',
    html: vehicleIconHtml(markerHex.blue),
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
      <FitToMarkers markers={markers} />
      <FlyToMarker markers={markers} focusRequest={focusRequest} />
      <TripPath />
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
              tripId={m.tripId}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
