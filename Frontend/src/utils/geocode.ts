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

// Turns coordinates back into a short, human-readable place name (e.g. "Soil Road, Mwiki")
// for display on live-tracking markers - the opposite direction of geocodeAddress above.
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Reverse geocoding lookup failed');
  }

  const result = await response.json();
  if (!result || result.error) {
    return null;
  }

  const address = result.address ?? {};
  const specific = address.road || address.neighbourhood || address.suburb;
  const area = address.suburb || address.city_district || address.town || address.city || address.county;
  const parts = [specific, area].filter((part, index, all) => part && all.indexOf(part) === index);

  if (parts.length > 0) return parts.join(', ');
  return typeof result.display_name === 'string' ? result.display_name.split(',').slice(0, 2).join(',').trim() : null;
}
