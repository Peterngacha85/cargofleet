// Expo inlines any env var prefixed EXPO_PUBLIC_ at build time (same idea as Vite's VITE_
// prefix on the web frontend) - see .env.example for the full list and where to get each value.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
