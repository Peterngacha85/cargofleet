export const DEFAULT_MAP_CENTER: [number, number] = [
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '-1.2865'),
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '36.8172'),
];

export const DEFAULT_MAP_ZOOM = parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '13', 10);

export const PHONE_REGEX = /^\+?[0-9]{10,}$/;

// A stationary GPS reading drifts a few meters from noise alone - recording every single tick
// while parked/stopped turns a trip's recorded route into a jittery starburst instead of a
// clean line. Skip a point unless the driver has actually moved, with a time-based fallback
// so a genuinely long stop still leaves an occasional "still here" point rather than a gap.
export const MIN_LOCATION_MOVEMENT_METERS = 15;
export const MIN_LOCATION_HEARTBEAT_MS = 60000;
