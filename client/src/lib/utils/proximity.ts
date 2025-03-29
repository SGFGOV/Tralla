/**
 * Utility functions for proximity features in the app
 */

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance * 1000; // Convert to meters
}

// Convert degrees to radians
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km}km away`;
  }
}

// Calculate if two users are within proximity range
export function isInProximity(
  user1Lat: number,
  user1Lon: number,
  user2Lat: number,
  user2Lon: number,
  radius: number
): boolean {
  const distance = calculateDistance(user1Lat, user1Lon, user2Lat, user2Lon);
  return distance <= radius;
}

// Generate a proximity score based on distance
// 100 = very close, 0 = at the edge of the radius
export function proximityScore(
  distance: number,
  radius: number
): number {
  if (distance >= radius) return 0;
  return Math.round(100 - (distance / radius) * 100);
}

// Sort users by proximity
export function sortByProximity(
  users: any[],
  currentLat: number,
  currentLon: number
): any[] {
  return [...users].sort((a, b) => {
    if (!a.location || !b.location) return 0;
    
    const distanceA = calculateDistance(
      currentLat,
      currentLon,
      a.location.latitude,
      a.location.longitude
    );
    
    const distanceB = calculateDistance(
      currentLat,
      currentLon,
      b.location.latitude,
      b.location.longitude
    );
    
    return distanceA - distanceB;
  });
}
