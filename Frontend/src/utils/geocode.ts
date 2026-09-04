export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

// OpenStreetMap's free Nominatim geocoder - same provider as the map tiles already in use.
// Fine for interactive, low-volume lookups like this; a paid provider (Google/Mapbox) would be
// worth switching to if this app starts making many requests per minute in production.
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(
    query
  )}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Geocoding lookup failed');
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}
