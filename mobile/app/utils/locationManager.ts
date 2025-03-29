import { Platform } from 'react-native';

// Interface for location data
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

// Interface for location region (for map display)
export interface LocationRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Class to handle location services and tracking
class LocationManager {
  private isInitialized: boolean = false;
  private hasPermission: boolean = false;
  private userId: number | null = null;
  private currentLocation: LocationData | null = null;
  private locationSubscription: any = null;
  private locationWatchId: any = null;
  private onLocationUpdateCallback: ((location: LocationData) => Promise<void>) | null = null;
  private backgroundTracking: boolean = false;
  private trackingInterval: number = 30000; // 30 seconds
  
  // Initialize location manager and request permissions
  async init(userId: number): Promise<{ initialized: boolean; error?: string }> {
    try {
      this.userId = userId;
      
      // In a real app, this would request location permissions:
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== 'granted') {
      //   return {
      //     initialized: false,
      //     error: 'Location permission denied'
      //   };
      // }
      // 
      // if (this.backgroundTracking) {
      //   const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      //   if (backgroundStatus !== 'granted') {
      //     this.backgroundTracking = false;
      //   }
      // }
      
      // For simulation, assume we have permission
      this.hasPermission = true;
      
      // Get initial location
      await this.getCurrentLocation();
      
      this.isInitialized = true;
      
      return {
        initialized: true
      };
    } catch (error) {
      console.error('Error initializing location manager:', error);
      return {
        initialized: false,
        error: `Error initializing location: ${error}`
      };
    }
  }
  
  // Start tracking location with callback
  async startTracking(onLocationUpdate?: (location: LocationData) => Promise<void>): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.hasPermission) {
        console.warn('Location manager not initialized or permission denied');
        return false;
      }
      
      // Set callback if provided
      if (onLocationUpdate) {
        this.onLocationUpdateCallback = onLocationUpdate;
      }
      
      // In a real app, this would start location tracking:
      // this.locationSubscription = await Location.watchPositionAsync(
      //   {
      //     accuracy: Location.Accuracy.High,
      //     distanceInterval: 10, // minimum change (in meters) to trigger update
      //     timeInterval: this.trackingInterval
      //   },
      //   (location) => this.handleLocationUpdate(location)
      // );
      
      // For simulation in development, create an interval to simulate location updates
      if (__DEV__) {
        this.locationWatchId = setInterval(() => {
          const mockLocation = this.getMockLocation();
          this.handleLocationUpdate(mockLocation);
        }, this.trackingInterval);
      }
      
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }
  
  // Stop tracking location
  stopTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    
    if (this.locationWatchId) {
      clearInterval(this.locationWatchId);
      this.locationWatchId = null;
    }
    
    this.onLocationUpdateCallback = null;
  }
  
  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      if (!this.isInitialized || !this.hasPermission) {
        return null;
      }
      
      // In a real app, this would get the current location:
      // const location = await Location.getCurrentPositionAsync({
      //   accuracy: Location.Accuracy.High
      // });
      // 
      // this.currentLocation = {
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      //   accuracy: location.coords.accuracy,
      //   altitude: location.coords.altitude,
      //   heading: location.coords.heading,
      //   speed: location.coords.speed,
      //   timestamp: location.timestamp
      // };
      
      // For simulation, generate a mock location
      this.currentLocation = this.getMockLocation();
      
      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
  
  // Handle location update
  private async handleLocationUpdate(location: any): Promise<void> {
    try {
      let locationData: LocationData;
      
      // In a real app, this would parse the location from the system:
      // locationData = {
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      //   accuracy: location.coords.accuracy,
      //   altitude: location.coords.altitude,
      //   heading: location.coords.heading,
      //   speed: location.coords.speed,
      //   timestamp: location.timestamp
      // };
      
      // For simulation, use the provided location data
      locationData = location;
      
      // Update current location
      this.currentLocation = locationData;
      
      // Send location to server
      await this.updateServerLocation(locationData);
      
      // Call callback if provided
      if (this.onLocationUpdateCallback) {
        await this.onLocationUpdateCallback(locationData);
      }
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }
  
  // Update server with current location
  private async updateServerLocation(location: LocationData): Promise<void> {
    try {
      if (!this.userId) return;
      
      // In a real app, this would send the location to the server:
      // await fetch('/api/users/location', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     userId: this.userId,
      //     latitude: location.latitude,
      //     longitude: location.longitude,
      //     timestamp: location.timestamp || Date.now()
      //   })
      // });
      
      console.log('Updated server with location:', location);
    } catch (error) {
      console.error('Error updating server location:', error);
    }
  }
  
  // Generate a mock location for development
  private getMockLocation(): LocationData {
    // Base coordinates in Manhattan, NYC
    const baseLatitude = 40.7128;
    const baseLongitude = -74.0060;
    
    // Random offsets (approximately within a few blocks)
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;
    
    return {
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      accuracy: Math.random() * 10 + 5, // 5-15 meters accuracy
      altitude: Math.random() * 10 + 10, // 10-20 meters altitude
      heading: Math.random() * 360, // 0-360 degrees
      speed: Math.random() * 5, // 0-5 meters per second
      timestamp: Date.now()
    };
  }
  
  // Calculate distance between two coordinates in meters
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  // Convert coordinates to region (for map display)
  coordinatesToRegion(latitude: number, longitude: number, latitudeDelta: number = 0.0922, longitudeDelta: number = 0.0421): LocationRegion {
    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta
    };
  }
  
  // Check if location services are enabled
  isLocationEnabled(): boolean {
    return this.isInitialized && this.hasPermission;
  }
  
  // Get current location data
  getLocationData(): LocationData | null {
    return this.currentLocation;
  }
  
  // Clean up resources
  cleanup(): void {
    this.stopTracking();
    this.isInitialized = false;
    this.hasPermission = false;
    this.userId = null;
    this.currentLocation = null;
  }
}

// Create and export a singleton instance
export const locationManager = new LocationManager();

export default locationManager;