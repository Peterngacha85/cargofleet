// Holds GPS points captured while the driver's socket has no connection, so a signal-dead
// stretch of a trip doesn't just vanish from the recorded route. Backed by localStorage
// (not memory) so it survives a page reload or the app being backgrounded/killed mid-trip -
// the socket.io client's own in-memory resend buffer wouldn't.
const STORAGE_KEY = 'cargofleet_offline_location_queue';

export interface QueuedLocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  tripId: string;
  timestamp: string;
}

export function enqueueOfflineLocationPoint(point: QueuedLocationPoint) {
  try {
    const points = getQueuedLocationPoints();
    points.push(point);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch {
    // localStorage unavailable/full - dropping this point beats crashing location tracking.
  }
}

export function getQueuedLocationPoints(): QueuedLocationPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueuedLocationPoints() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
