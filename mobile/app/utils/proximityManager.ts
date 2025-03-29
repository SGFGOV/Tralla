import { Platform } from 'react-native';
import { postData } from './api';
import { locationManager, type LocationData } from './locationManager';
import { nfcManager, type NfcProfile } from './nfcManager';
import { cameraManager, type DetectedFace } from './cameraManager';

// Enum for proximity detection methods
export enum ProximityMethod {
  LOCATION = 'location',
  NFC = 'nfc',
  CAMERA = 'camera'
}

// Interface for proximity settings
export interface ProximitySettings {
  userId: number;
  maxDistance: number; // in meters
  enableLocation: boolean;
  enableNfc: boolean;
  enableCamera: boolean;
  shareProfile: boolean;
  shareLocation: boolean;
  notifyOnNearby: boolean;
}

// Interface for nearby user information
export interface NearbyUser {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  distance?: number; // in meters, if detected via location
  lastSeen: Date;
  methods: ProximityMethod[];
  confidence: number; // 0-100 percentage of confidence in detection
  online: boolean;
}

// Class to handle proximity detection and management
class ProximityManager {
  private isInitialized: boolean = false;
  private locationEnabled: boolean = false;
  private nfcEnabled: boolean = false;
  private cameraEnabled: boolean = false;
  private userId: number | null = null;
  private settings: ProximitySettings | null = null;
  private nearbyUsers: Map<number, NearbyUser> = new Map();
  private onUserDetectedCallback: ((user: NearbyUser) => void) | null = null;
  private onUsersUpdateCallback: ((users: NearbyUser[]) => void) | null = null;
  
  // Initialize the proximity manager with all detection methods
  async init(userId: number): Promise<{ initialized: boolean; error?: string }> {
    try {
      this.userId = userId;
      
      // Initialize location manager
      const locationResult = await locationManager.init(userId);
      this.locationEnabled = locationResult.initialized;
      
      // Initialize NFC manager
      const nfcResult = await nfcManager.init();
      this.nfcEnabled = nfcResult.initialized;
      
      // Initialize camera manager
      const cameraResult = await cameraManager.init();
      this.cameraEnabled = cameraResult.initialized;
      
      // Load settings
      await this.loadSettings();
      
      this.isInitialized = true;
      
      return {
        initialized: true
      };
    } catch (error) {
      console.error('Error initializing proximity manager:', error);
      return {
        initialized: false,
        error: `Error initializing proximity: ${error}`
      };
    }
  }
  
  // Start proximity detection with callbacks
  async startDetection(onUserDetected?: (user: NearbyUser) => void, onUsersUpdate?: (users: NearbyUser[]) => void): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('Proximity manager not initialized');
      return false;
    }
    
    // Set callbacks if provided
    if (onUserDetected) {
      this.onUserDetectedCallback = onUserDetected;
    }
    
    if (onUsersUpdate) {
      this.onUsersUpdateCallback = onUsersUpdate;
    }
    
    // Start location tracking if enabled
    if (this.settings?.enableLocation && this.locationEnabled) {
      await locationManager.startTracking(this.handleLocationUpdate.bind(this));
    }
    
    // Start NFC scanning if enabled
    if (this.settings?.enableNfc && this.nfcEnabled) {
      await nfcManager.startReading(this.handleNfcTagDiscovered.bind(this));
    }
    
    // Start camera detection if enabled
    if (this.settings?.enableCamera && this.cameraEnabled) {
      cameraManager.startFaceDetection(this.handleFacesDetected.bind(this));
    }
    
    // For simulation in development, generate some mock users
    if (__DEV__) {
      // Generate some nearby users by different methods
      const mockLocationUsers = this.generateMockNearbyUsers(3, ProximityMethod.LOCATION, locationManager.getLocationData());
      mockLocationUsers.forEach(user => this.addOrUpdateNearbyUser(user));
      
      const mockNfcUsers = this.generateMockNearbyUsers(1, ProximityMethod.NFC);
      mockNfcUsers.forEach(user => this.addOrUpdateNearbyUser(user));
      
      const mockCameraUsers = this.generateMockNearbyUsers(2, ProximityMethod.CAMERA);
      mockCameraUsers.forEach(user => this.addOrUpdateNearbyUser(user));
      
      // Notify listeners
      this.notifyListeners();
    }
    
    return true;
  }
  
  // Stop all proximity detection methods
  stopDetection(): void {
    // Stop location tracking
    if (this.locationEnabled) {
      locationManager.stopTracking();
    }
    
    // Stop NFC scanning
    if (this.nfcEnabled) {
      nfcManager.stopReading();
    }
    
    // Stop camera detection
    if (this.cameraEnabled) {
      cameraManager.stopFaceDetection();
    }
    
    // Clear callbacks
    this.onUserDetectedCallback = null;
    this.onUsersUpdateCallback = null;
  }
  
  // Handle location updates
  private async handleLocationUpdate(location: LocationData): Promise<void> {
    try {
      if (!this.settings) return;
      
      // Fetch nearby users from server using current location
      const nearbyUsers = await this.fetchNearbyUsersByLocation(location);
      
      // Update nearby users
      nearbyUsers.forEach(user => {
        this.addOrUpdateNearbyUser(user);
      });
      
      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }
  
  // Handle NFC tag discoveries
  private async handleNfcTagDiscovered(tag: any): Promise<void> {
    try {
      // Read profile from NFC tag
      const profile = await nfcManager.readProfileFromTag(tag);
      
      if (profile) {
        // Create nearby user from NFC profile
        const nearbyUser: NearbyUser = {
          userId: profile.userId,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          lastSeen: new Date(),
          methods: [ProximityMethod.NFC],
          confidence: 100, // NFC provides high confidence
          online: true
        };
        
        // Update nearby users
        this.addOrUpdateNearbyUser(nearbyUser);
        
        // Notify listeners
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error handling NFC tag discovery:', error);
    }
  }
  
  // Handle faces detected by camera
  private handleFacesDetected(faces: DetectedFace[]): void {
    try {
      // Process only faces with identified users
      faces.filter(face => face.userId).forEach(face => {
        if (!face.userId || !face.username || !face.displayName) return;
        
        // Create nearby user from detected face
        const nearbyUser: NearbyUser = {
          userId: face.userId,
          username: face.username,
          displayName: face.displayName,
          lastSeen: new Date(),
          methods: [ProximityMethod.CAMERA],
          confidence: face.faceMatchConfidence || 70, // Use face match confidence if available
          online: true
        };
        
        // Update nearby users
        this.addOrUpdateNearbyUser(nearbyUser);
      });
      
      // Notify listeners
      if (faces.filter(face => face.userId).length > 0) {
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error handling faces detection:', error);
    }
  }
  
  // Add or update a nearby user in the map
  private addOrUpdateNearbyUser(user: NearbyUser): void {
    const existingUser = this.nearbyUsers.get(user.userId);
    
    if (existingUser) {
      // Update existing user
      existingUser.lastSeen = user.lastSeen;
      
      // Add new detection method if not already present
      if (user.methods && user.methods.length > 0) {
        for (const method of user.methods) {
          if (!existingUser.methods.includes(method)) {
            existingUser.methods.push(method);
          }
        }
      }
      
      // Update distance if provided
      if (user.distance !== undefined) {
        existingUser.distance = user.distance;
      }
      
      // Update confidence based on multiple detection methods
      if (existingUser.methods.length > 1) {
        // Increase confidence if detected by multiple methods
        existingUser.confidence = Math.min(100, existingUser.confidence + 10);
      } else {
        // Use the new confidence if higher
        existingUser.confidence = Math.max(existingUser.confidence, user.confidence);
      }
      
      // Update online status
      existingUser.online = user.online;
    } else {
      // Add new user
      this.nearbyUsers.set(user.userId, user);
      
      // Notify about new user detection
      if (this.onUserDetectedCallback) {
        this.onUserDetectedCallback(user);
      }
    }
  }
  
  // Calculate confidence based on distance
  private calculateLocationConfidence(distance: number | null): number {
    if (!distance) return 70;
    
    if (distance < 5) return 90; // Very close
    if (distance < 20) return 85; // Close
    if (distance < 50) return 80; // Nearby
    if (distance < 100) return 75; // Medium distance
    if (distance < 200) return 70; // Far
    return 60; // Very far
  }
  
  // Fetch user profile from server
  private async fetchUserProfile(userId: number): Promise<void> {
    try {
      const userProfile = await postData(`/users/${userId}`, {});
      
      // Update user in nearby users if found
      const existingUser = this.nearbyUsers.get(userId);
      if (existingUser && userProfile) {
        existingUser.username = userProfile.username;
        existingUser.displayName = userProfile.displayName;
        existingUser.avatarUrl = userProfile.avatarUrl;
        existingUser.online = userProfile.online;
      }
    } catch (error) {
      console.error(`Error fetching user profile for ID ${userId}:`, error);
    }
  }
  
  // Fetch nearby users by location from server
  private async fetchNearbyUsersByLocation(location: LocationData): Promise<NearbyUser[]> {
    try {
      if (!this.userId || !this.settings) return [];
      
      // In a real app, this would fetch nearby users from the server:
      // const response = await postData('/users/nearby', {
      //   userId: this.userId,
      //   latitude: location.latitude,
      //   longitude: location.longitude,
      //   maxDistance: this.settings.maxDistance
      // });
      // return response.users;
      
      // For simulation in development, generate some random nearby users
      return this.generateMockNearbyUsers(5, ProximityMethod.LOCATION, location);
    } catch (error) {
      console.error('Error fetching nearby users by location:', error);
      return [];
    }
  }
  
  // Notify listeners about updated nearby users
  private notifyListeners(): void {
    if (this.onUsersUpdateCallback) {
      const users = Array.from(this.nearbyUsers.values());
      this.onUsersUpdateCallback(users);
    }
  }
  
  // Load user proximity settings from server
  private async loadSettings(): Promise<void> {
    try {
      if (!this.userId) return;
      
      // In a real app, this would load settings from the server:
      // const settings = await postData(`/users/${this.userId}/proximity-settings`, {});
      // this.settings = settings;
      
      // For simulation, use default settings
      this.settings = {
        userId: this.userId,
        maxDistance: 200, // meters
        enableLocation: true,
        enableNfc: true,
        enableCamera: true,
        shareProfile: true,
        shareLocation: true,
        notifyOnNearby: true
      };
    } catch (error) {
      console.error('Error loading proximity settings:', error);
      
      // Create default settings
      if (this.userId) {
        this.settings = {
          userId: this.userId,
          maxDistance: 200, // meters
          enableLocation: true,
          enableNfc: true,
          enableCamera: true,
          shareProfile: true,
          shareLocation: true,
          notifyOnNearby: true
        };
      }
    }
  }
  
  // Update proximity settings
  async updateSettings(settings: Partial<ProximitySettings>): Promise<boolean> {
    try {
      if (!this.userId || !this.settings) return false;
      
      // Update settings
      this.settings = {
        ...this.settings,
        ...settings
      };
      
      // In a real app, this would save settings to the server:
      // await postData(`/users/${this.userId}/proximity-settings`, this.settings);
      
      // Update detection methods based on new settings
      // Location
      if (this.settings.enableLocation && this.locationEnabled) {
        if (!locationManager.isLocationEnabled()) {
          await locationManager.init(this.userId);
          await locationManager.startTracking(this.handleLocationUpdate.bind(this));
        }
      } else if (locationManager.isLocationEnabled()) {
        locationManager.stopTracking();
      }
      
      // NFC
      if (this.settings.enableNfc && this.nfcEnabled) {
        if (!nfcManager.isReading()) {
          await nfcManager.startReading(this.handleNfcTagDiscovered.bind(this));
        }
      } else if (nfcManager.isReading()) {
        await nfcManager.stopReading();
      }
      
      // Camera
      if (this.settings.enableCamera && this.cameraEnabled) {
        if (!cameraManager.isFaceDetectionEnabled()) {
          cameraManager.startFaceDetection(this.handleFacesDetected.bind(this));
        }
      } else if (cameraManager.isFaceDetectionEnabled()) {
        cameraManager.stopFaceDetection();
      }
      
      return true;
    } catch (error) {
      console.error('Error updating proximity settings:', error);
      return false;
    }
  }
  
  // Register a user's face
  async registerFace(faceData: any): Promise<boolean> {
    try {
      if (!this.userId) return false;
      
      // Get mock user data for simulation
      const userProfile = await this.fetchMockUserProfile(this.userId);
      
      // Register face with camera manager
      return await cameraManager.registerFace(
        this.userId,
        userProfile.username,
        userProfile.displayName,
        faceData
      );
    } catch (error) {
      console.error('Error registering face:', error);
      return false;
    }
  }
  
  // Register an NFC tag with user profile
  async registerNfcTag(username: string, displayName: string): Promise<boolean> {
    try {
      if (!this.userId) return false;
      
      // Create profile data
      const profile: NfcProfile = {
        userId: this.userId,
        username,
        displayName,
        timestamp: Date.now()
      };
      
      // Write profile to NFC tag
      return await nfcManager.writeProfileToTag(profile);
    } catch (error) {
      console.error('Error registering NFC tag:', error);
      return false;
    }
  }
  
  // Get the list of nearby users
  getNearbyUsers(): NearbyUser[] {
    return Array.from(this.nearbyUsers.values());
  }
  
  // Get user proximity settings
  getSettings(): ProximitySettings | null {
    return this.settings;
  }
  
  // Check if a specific proximity method is active
  isMethodActive(method: ProximityMethod): boolean {
    switch (method) {
      case ProximityMethod.LOCATION:
        return this.locationEnabled && !!this.settings?.enableLocation;
      case ProximityMethod.NFC:
        return this.nfcEnabled && !!this.settings?.enableNFC;
      case ProximityMethod.CAMERA:
        return this.cameraEnabled && !!this.settings?.enableCamera;
      default:
        return false;
    }
  }
  
  // Check if proximity manager is initialized
  isInitialized(): boolean {
    return this.isInitialized;
  }
  
  // Helper method to fetch mock user profile
  private async fetchMockUserProfile(userId: number): Promise<{ username: string, displayName: string }> {
    // In a real app, this would fetch the user profile from the server
    // For simulation, create a mock profile
    return {
      username: `user${userId}`,
      displayName: this.getRandomName()
    };
  }
  
  // Generate mock nearby users for development
  private generateMockNearbyUsers(count: number, method: ProximityMethod, location?: LocationData): NearbyUser[] {
    const users: NearbyUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = Math.floor(Math.random() * 1000) + 1;
      
      // Generate a distance if using location method
      let distance: number | undefined = undefined;
      if (method === ProximityMethod.LOCATION && location) {
        distance = Math.random() * this.settings?.maxDistance || 200;
      }
      
      // Create a user object
      const user: NearbyUser = {
        userId,
        username: `user${userId}`,
        displayName: this.getRandomName(),
        distance,
        lastSeen: new Date(),
        methods: [method],
        confidence: method === ProximityMethod.NFC ? 100 : 
                   method === ProximityMethod.CAMERA ? 
                   (Math.random() * 30 + 60) : // 60-90% for camera
                   this.calculateLocationConfidence(distance || null), // Location confidence
        online: Math.random() > 0.2 // 80% chance to be online
      };
      
      users.push(user);
    }
    
    return users;
  }
  
  // Helper to generate random names for development
  private getRandomName(): string {
    const firstNames = [
      'Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Riley',
      'Morgan', 'Drew', 'Hayden', 'Dakota', 'Avery', 'Quinn'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
      'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
  
  // Clean up resources
  cleanup(): void {
    this.stopDetection();
    
    if (this.locationEnabled) {
      locationManager.cleanup();
    }
    
    if (this.nfcEnabled) {
      nfcManager.cleanup();
    }
    
    if (this.cameraEnabled) {
      cameraManager.cleanup();
    }
    
    this.nearbyUsers.clear();
    this.isInitialized = false;
  }
}

// Create and export a singleton instance
export const proximityManager = new ProximityManager();

export default proximityManager;