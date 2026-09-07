import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PublicService } from '@/services/publicService';
import { PublicTrackingInfo } from '@/types/public';
import { DEFAULT_MAP_CENTER } from '@/utils/constants';
import { statusLabel } from '@/utils/formatters';

const POLL_INTERVAL_MS = 10000;

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#A3E635;border:3px solid #1F2937;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function RecenterOnMove({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    // Only snaps to the driver's position once (first fix) - after that the visitor may be
    // panning/zooming themselves, and a live tracking page shouldn't keep yanking the map.
    if (hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    map.setView([latitude, longitude], 15);
  }, [latitude, longitude, map]);

  return null;
}

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<PublicTrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const poll = () => {
      PublicService.getTracking(token)
        .then((res) => {
          if (cancelled) return;
          if (res.success && res.data) {
            setInfo(res.data);
          } else {
            setError(res.message || 'Tracking link not found or expired.');
          }
        })
        .catch(() => {
          if (!cancelled) setError('Tracking link not found or expired.');
        });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col bg-soft-gray">
      <div className="bg-charcoal px-4 py-3 text-white">
        <p className="font-semibold">CargoFleet</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {error && <p className="card text-sm text-red-600">{error}</p>}

        {!error && !info && <p className="card text-sm text-gray-500">Loading tracking info…</p>}

        {info && (
          <>
            <div className="card">
              <p className="font-semibold text-charcoal">{info.tripNumber}</p>
              <p className="text-sm text-gray-500">
                {info.driverFirstName ? `${info.driverFirstName} is delivering to` : 'Delivering to'}{' '}
                {info.dropoffAddress}
              </p>
              <span className="mt-1 inline-block rounded-full bg-lime px-2 py-0.5 text-xs font-medium text-charcoal">
                {statusLabel(info.status)}
              </span>
            </div>

            <div className="h-[calc(100vh-220px)] w-full overflow-hidden rounded-lg">
              {info.location ? (
                <MapContainer
                  center={[info.location.latitude, info.location.longitude]}
                  zoom={15}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterOnMove latitude={info.location.latitude} longitude={info.location.longitude} />
                  <Marker position={[info.location.latitude, info.location.longitude]} icon={markerIcon}>
                    <Popup>
                      Last updated: {new Date(info.location.timestamp).toLocaleTimeString()}
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <MapContainer center={DEFAULT_MAP_CENTER} zoom={12} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </MapContainer>
              )}
            </div>
            {!info.location && (
              <p className="text-center text-sm text-gray-500">
                Waiting for the driver to start sharing their location.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
