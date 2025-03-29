import * as Location from 'expo-location';
import { Platform } from 'react-native';
import api from './api';

// Type definitions
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface LocationPermissionStatus {
  status: Location.PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

// Class to handle location operations
class LocationManager {
  private isInitialized: boolean = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private currentLocation: LocationData | null = null;
  private updateInterval: number = 5000; // Default update interval (5 seconds)
  private userId: number | null = null;

  // Initialize location services
  async init(userId: number | null = null) {
    try {
      if (userId) {
        this.userId = userId;
      }
      
      // Request foreground location permissions
      const permissionResult = await this.requestLocationPermission();
      
      if (permissionResult.granted) {
        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp
        };
        
        this.isInitialized = true;
        
        return {
          initialized: this.isInitialized,
          location: this.currentLocation,
          permission: permissionResult
        };
      } else {
        return {
          initialized: false,
          location: null,
          permission: permissionResult,
          error: 'Location permission not granted'
        };
      }
    } catch (error) {
      console.error('Error initializing location manager:', error);
      return {
        initialized: false,
        location: null,
        error: `Error initializing location: ${error}`
      };
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    let permissionResult;
    
    if (Platform.OS === 'ios') {
      // Request foreground location permission on iOS
      permissionResult = await Location.requestForegroundPermissionsAsync();
    } else {
      // Request both foreground and background location permission on Android
      permissionResult = await Location.requestForegroundPermissionsAsync();
      
      if (permissionResult.granted) {
        const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
        
        // If background permission denied, we can still use foreground
        if (!backgroundPermission.granted) {
          console.warn('Background location permission denied');
        }
      }
    }
    
    return {
      status: permissionResult.status,
      canAskAgain: permissionResult.canAskAgain,
      granted: permissionResult.granted
    };
  }

  // Start location tracking
  async startTracking(callback?: (location: LocationData) => void) {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }
    
    // Start watching location with specified accuracy and update interval
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 10, // Minimum distance (in meters) between updates
        timeInterval: this.updateInterval // Minimum time (in ms) between updates
      },
      (location) => {
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp
        };
        
        // If a callback is provided, call it with the new location
        if (callback) {
          callback(this.currentLocation);
        }
        
        // If userId is provided, update the user's location on the server
        if (this.userId) {
          this.updateLocationOnServer();
        }
      }
    );
    
    return true;
  }

  // Stop location tracking
  stopTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      return true;
    }
    return false;
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!this.isInitialized) {
      await this.init();
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp
      };
      
      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Update the user's location on the server
  private async updateLocationOnServer() {
    if (!this.userId || !this.currentLocation) {
      return;
    }
    
    try {
      await api.users.updateProfile(this.userId, {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude
      });
    } catch (error) {
      console.error('Error updating location on server:', error);
    }
  }

  // Set userId for server updates
  setUserId(userId: number) {
    this.userId = userId;
  }

  // Set the update interval for location tracking
  setUpdateInterval(interval: number) {
    this.updateInterval = interval;
    
    // If already tracking, restart tracking with the new interval
    if (this.locationSubscription) {
      this.stopTracking();
      this.startTracking();
    }
  }

  // Calculate distance between two coordinates in meters
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
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

  // Check if a location is within a specified radius
  isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusInMeters: number): boolean {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusInMeters;
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  // Clean up resources
  cleanup() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isInitialized = false;
    this.currentLocation = null;
  }
}

// Create and export a singleton instance
export const locationManager = new LocationManager();

export default locationManager;