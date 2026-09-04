import { Circle } from 'react-leaflet';

interface GeofenceOverlayProps {
  center: [number, number];
  radiusMeters: number;
}

/** Phase 2 feature (see 11_PHASE_ROADMAP.md) - renders a branch geofence boundary on the map. */
export default function GeofenceOverlay({ center, radiusMeters }: GeofenceOverlayProps) {
  return (
    <Circle
      center={center}
      radius={radiusMeters}
      pathOptions={{ color: '#A3E635', fillColor: '#A3E635', fillOpacity: 0.1 }}
    />
  );
}
