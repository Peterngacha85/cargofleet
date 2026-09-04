export const DEFAULT_MAP_CENTER: [number, number] = [
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '-1.2865'),
  parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '36.8172'),
];

export const DEFAULT_MAP_ZOOM = parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '13', 10);

export const PHONE_REGEX = /^\+?[0-9]{10,}$/;
