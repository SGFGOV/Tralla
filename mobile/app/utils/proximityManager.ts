import { Platform } from 'react-native';
import locationManager, { LocationData } from './locationManager';
import nfcManager, { NfcProfile } from './nfcManager';
import cameraManager, { DetectedFace } from './cameraManager';
import { fetchData, postData } from './api';

// Define __DEV__ for development mode
declare const __DEV__: boolean;

// Enum of available proximity detection methods
export enum ProximityMethod {
  LOCATION = 'location',
  NFC = 'nfc',
  CAMERA = 'camera'
}

// Interface for user proximity settings
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
  faceData?: any; // Face recognition data for the user
}

// Class to manage proximity detection across all methods
class ProximityManager {
  private isInitialized: boolean = false;
  private locationEnabled: boolean = false;
  private nfcEnabled: boolean = false;
  private cameraEnabled: boolean = false;
  private userId: number | null = null;
  private settings: ProximitySettings | null = null;
  private nearbyUsers: Map<number, NearbyUser> = new Map();
  // Callbacks for user detection and updates
  public onUserDetectedCallback: ((user: NearbyUser) => void) | null = null;
  public onUsersUpdateCallback: ((users: NearbyUser[]) => void) | null = null;
  
  // Initialize proximity manager
  async init(userId: number): Promise<{ initialized: boolean; error?: string }> {
    try {
      this.userId = userId;
      
      // Load user settings
      await this.loadSettings();
      
      // Initialize location manager if enabled
      if (this.settings?.enableLocation) {
        const locationResult = await locationManager.init(userId);
        this.locationEnabled = locationResult.initialized;
        if (!locationResult.initialized) {
          console.warn("Location initialization failed:", locationResult.error);
        }
      }
      
      // Initialize NFC manager if enabled
      if (this.settings?.enableNfc) {
        const nfcResult = await nfcManager.init();
        this.nfcEnabled = nfcResult.initialized;
        if (!nfcResult.initialized) {
          console.warn("NFC initialization failed:", nfcResult.error);
        }
      }
      
      // Initialize camera manager if enabled
      if (this.settings?.enableCamera) {
        const cameraResult = await cameraManager.init();
        this.cameraEnabled = cameraResult.initialized;
        if (!cameraResult.initialized) {
          console.warn("Camera initialization failed:", cameraResult.error);
        }
      }
      
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
    try {
      if (!this.isInitialized || !this.userId) {
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
      if (this.locationEnabled && this.settings?.enableLocation) {
        await locationManager.startTracking(this.handleLocationUpdate.bind(this));
      }
      
      // Start NFC reading if enabled
      if (this.nfcEnabled && this.settings?.enableNfc) {
        await nfcManager.startReading(this.handleNfcTagDiscovered.bind(this));
      }
      
      // Start camera face detection if enabled
      if (this.cameraEnabled && this.settings?.enableCamera) {
        cameraManager.startFaceDetection(this.handleFacesDetected.bind(this));
      }
      
      // In development mode, simulate nearby users
      if (__DEV__) {
        // Generate mock nearby users for each enabled method
        const currentLocation = locationManager.getLocationData() || undefined;
        
        if (this.locationEnabled) {
          const mockLocationUsers = this.generateMockNearbyUsers(3, ProximityMethod.LOCATION, currentLocation);
          mockLocationUsers.forEach(user => this.addOrUpdateNearbyUser(user));
        }
        
        if (this.nfcEnabled) {
          const mockNfcUsers = this.generateMockNearbyUsers(2, ProximityMethod.NFC);
          mockNfcUsers.forEach(user => this.addOrUpdateNearbyUser(user));
        }
        
        if (this.cameraEnabled) {
          const mockCameraUsers = this.generateMockNearbyUsers(2, ProximityMethod.CAMERA);
          mockCameraUsers.forEach(user => this.addOrUpdateNearbyUser(user));
        }
        
        // Notify listeners of initial mock users
        this.notifyListeners();
      }
      
      return true;
    } catch (error) {
      console.error('Error starting proximity detection:', error);
      return false;
    }
  }
  
  // Stop proximity detection
  stopDetection(): void {
    try {
      if (this.locationEnabled) {
        locationManager.stopTracking();
      }
      
      if (this.nfcEnabled) {
        nfcManager.stopReading();
      }
      
      if (this.cameraEnabled) {
        cameraManager.stopFaceDetection();
      }
      
      this.nearbyUsers.clear();
      this.onUserDetectedCallback = null;
      this.onUsersUpdateCallback = null;
    } catch (error) {
      console.error('Error stopping proximity detection:', error);
    }
  }
  
  // Handle location update from location manager
  private async handleLocationUpdate(location: LocationData): Promise<void> {
    try {
      if (!this.isInitialized || !this.userId) return;
      
      // Fetch nearby users from the server
      const nearbyUsers = await this.fetchNearbyUsersByLocation(location);
      
      // Add or update nearby users
      nearbyUsers.forEach(user => {
        this.addOrUpdateNearbyUser(user);
      });
      
      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }
  
  // Handle NFC tag discovered
  private async handleNfcTagDiscovered(tag: any): Promise<void> {
    try {
      if (!this.isInitialized || !this.userId) return;
      
      // Get profile from NFC tag
      const profile = await nfcManager.readProfileFromTag(tag);
      
      if (profile) {
        // Create nearby user from profile
        const nearbyUser: NearbyUser = {
          userId: profile.userId,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          lastSeen: new Date(),
          methods: [ProximityMethod.NFC],
          confidence: 95, // High confidence for NFC
          online: true
        };
        
        // Add or update user
        this.addOrUpdateNearbyUser(nearbyUser);
        
        // Notify listeners
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error handling NFC tag discovery:', error);
    }
  }
  
  // Handle faces detected from camera manager
  private handleFacesDetected(faces: DetectedFace[]): void {
    try {
      if (!this.isInitialized || !this.userId) return;
      
      // Process each detected face
      faces.forEach(face => {
        if (face.userId) {
          // Create nearby user from face data
          const nearbyUser: NearbyUser = {
            userId: face.userId,
            username: face.username || `user${face.userId}`,
            displayName: face.displayName || `User ${face.userId}`,
            lastSeen: new Date(),
            methods: [ProximityMethod.CAMERA],
            confidence: face.faceMatchConfidence || 70, // Use face match confidence or default
            online: true,
            faceData: face.faceData
          };
          
          // Add or update user
          this.addOrUpdateNearbyUser(nearbyUser);
        }
      });
      
      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Error handling faces detected:', error);
    }
  }
  
  // Add or update a nearby user in the collection
  private addOrUpdateNearbyUser(user: NearbyUser): void {
    const existingUser = this.nearbyUsers.get(user.userId);
    
    if (existingUser) {
      // User already exists, update and merge
      const updatedUser: NearbyUser = {
        ...existingUser,
        lastSeen: user.lastSeen,
        online: user.online
      };
      
      // Merge methods if new method is detected
      if (!updatedUser.methods.includes(user.methods[0])) {
        updatedUser.methods = [...updatedUser.methods, ...user.methods];
      }
      
      // Update distance if provided
      if (user.distance !== undefined) {
        updatedUser.distance = user.distance;
      }
      
      // Update confidence based on multiple detection methods
      if (updatedUser.methods.length > 1) {
        // Increase confidence when detected through multiple methods
        updatedUser.confidence = Math.min(
          Math.max(existingUser.confidence, user.confidence) + 
          (5 * updatedUser.methods.length), // +5% per method
          98 // Cap at 98%
        );
      } else {
        // For single method, use the higher confidence
        updatedUser.confidence = Math.max(existingUser.confidence, user.confidence);
      }
      
      this.nearbyUsers.set(user.userId, updatedUser);
      
      // Check if this is a significant update to notify about
      const isSignificantUpdate = 
        existingUser.methods.length !== updatedUser.methods.length ||
        existingUser.confidence < updatedUser.confidence - 10 ||
        existingUser.online !== updatedUser.online;
      
      if (isSignificantUpdate && this.onUserDetectedCallback) {
        this.onUserDetectedCallback(updatedUser);
      }
    } else {
      // New user discovered
      this.nearbyUsers.set(user.userId, user);
      
      // Fetch additional user data (avatar, etc.) from server
      this.fetchUserProfile(user.userId);
      
      // Notify about new user
      if (this.onUserDetectedCallback) {
        this.onUserDetectedCallback(user);
      }
    }
  }
  
  // Calculate location-based confidence
  private calculateLocationConfidence(distance: number | null): number {
    if (distance === null) return 70; // Default confidence
    
    // Calculate confidence based on distance
    // Closer users have higher confidence
    const maxDistance = this.settings?.maxDistance || 100;
    
    if (distance <= 5) {
      return 90; // Very close (0-5m)
    } else if (distance <= 15) {
      return 80; // Close (5-15m)
    } else if (distance <= 50) {
      return 70; // Medium distance (15-50m)
    } else {
      // Linear scaling for farther distances
      return Math.max(50, 70 - ((distance - 50) / (maxDistance - 50)) * 20);
    }
  }
  
  // Fetch additional user profile data from server
  private async fetchUserProfile(userId: number): Promise<void> {
    try {
      if (!this.isInitialized) return;
      
      // In a real app, this would fetch the user profile from the server
      // const userProfile = await fetchData(`/users/${userId}`);
      
      // For simulation, fetch mock profile
      const userProfile = await this.fetchMockUserProfile(userId);
      
      // Update user if still in nearby list
      const existingUser = this.nearbyUsers.get(userId);
      if (existingUser) {
        this.nearbyUsers.set(userId, {
          ...existingUser,
          username: userProfile.username || existingUser.username,
          displayName: userProfile.displayName || existingUser.displayName,
          avatarUrl: existingUser.avatarUrl || `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
        });
        
        // Notify listeners
        this.notifyListeners();
      }
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
    }
  }
  
  // Fetch nearby users by location from server
  private async fetchNearbyUsersByLocation(location: LocationData): Promise<NearbyUser[]> {
    try {
      if (!this.isInitialized || !this.userId) return [];
      
      // In a real app, this would fetch nearby users from the server:
      // const response = await fetchData<any[]>(`/users/${this.userId}/nearby?latitude=${location.latitude}&longitude=${location.longitude}`);
      // 
      // const nearbyUsers: NearbyUser[] = response.map(user => ({
      //   userId: user.id,
      //   username: user.username,
      //   displayName: user.displayName,
      //   avatarUrl: user.avatarUrl,
      //   distance: user.distance,
      //   lastSeen: new Date(),
      //   methods: [ProximityMethod.LOCATION],
      //   confidence: this.calculateLocationConfidence(user.distance),
      //   online: user.online
      // }));
      
      // For simulation, generate 0-3 random nearby users
      const count = Math.floor(Math.random() * 4);
      const users = this.generateMockNearbyUsers(count, ProximityMethod.LOCATION, location);
      
      return users;
    } catch (error) {
      console.error('Error fetching nearby users by location:', error);
      return [];
    }
  }
  
  // Notify listeners of nearby users update
  private notifyListeners(): void {
    if (this.onUsersUpdateCallback) {
      const usersList = Array.from(this.nearbyUsers.values());
      this.onUsersUpdateCallback(usersList);
    }
  }
  
  // Load user proximity settings
  private async loadSettings(): Promise<void> {
    try {
      if (!this.userId) return;
      
      // In a real app, this would fetch settings from the server:
      // const settings = await fetchData<ProximitySettings>(`/users/${this.userId}/proximity-settings`);
      
      // For simulation, use default settings
      this.settings = {
        userId: this.userId,
        maxDistance: 100, // 100 meters
        enableLocation: true,
        enableNfc: true,
        enableCamera: true,
        shareProfile: true,
        shareLocation: true,
        notifyOnNearby: true
      };
    } catch (error) {
      console.error('Error loading proximity settings:', error);
      
      // Set default settings if error
      if (this.userId) {
        this.settings = {
          userId: this.userId,
          maxDistance: 100,
          enableLocation: true,
          enableNfc: Platform.OS === 'android',
          enableCamera: true,
          shareProfile: true,
          shareLocation: true,
          notifyOnNearby: true
        };
      }
    }
  }
  
  // Update user proximity settings
  async updateSettings(settings: Partial<ProximitySettings>): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.userId || !this.settings) {
        return false;
      }
      
      // Update local settings
      this.settings = {
        ...this.settings,
        ...settings
      };
      
      // In a real app, this would save settings to the server:
      // await postData(`/users/${this.userId}/proximity-settings`, this.settings);
      
      // Stop/start methods based on new settings
      if (settings.enableLocation !== undefined && this.locationEnabled !== settings.enableLocation) {
        if (settings.enableLocation) {
          await locationManager.init(this.userId);
          await locationManager.startTracking(this.handleLocationUpdate.bind(this));
        } else {
          locationManager.stopTracking();
        }
        this.locationEnabled = settings.enableLocation;
      }
      
      if (settings.enableNfc !== undefined && this.nfcEnabled !== settings.enableNfc) {
        if (settings.enableNfc) {
          await nfcManager.init();
          await nfcManager.startReading(this.handleNfcTagDiscovered.bind(this));
        } else {
          await nfcManager.stopReading();
        }
        this.nfcEnabled = settings.enableNfc;
      }
      
      if (settings.enableCamera !== undefined && this.cameraEnabled !== settings.enableCamera) {
        if (settings.enableCamera) {
          await cameraManager.init();
          cameraManager.startFaceDetection(this.handleFacesDetected.bind(this));
        } else {
          cameraManager.stopFaceDetection();
        }
        this.cameraEnabled = settings.enableCamera;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating proximity settings:', error);
      return false;
    }
  }
  
  // Register face data for the current user
  async registerFace(faceData: any): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.userId) {
        return false;
      }
      
      if (!this.cameraEnabled) {
        await cameraManager.init();
        this.cameraEnabled = true;
      }
      
      // Get user display name and username
      const user = await this.fetchMockUserProfile(this.userId);
      
      // Register face with camera manager
      return await cameraManager.registerFace(
        this.userId,
        user.username,
        user.displayName,
        faceData
      );
    } catch (error) {
      console.error('Error registering face:', error);
      return false;
    }
  }
  
  // Register NFC tag for the user
  async registerNfcTag(username: string, displayName: string): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.userId) {
        return false;
      }
      
      if (!this.nfcEnabled) {
        await nfcManager.init();
        this.nfcEnabled = true;
      }
      
      // Create profile to write to tag
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
  
  // Get all nearby users
  getNearbyUsers(): NearbyUser[] {
    return Array.from(this.nearbyUsers.values());
  }
  
  // Get current settings
  getSettings(): ProximitySettings | null {
    return this.settings;
  }
  
  // Take a picture for face detection
  async takePicture(): Promise<any> {
    if (!this.cameraEnabled) {
      await cameraManager.init();
      this.cameraEnabled = true;
    }
    return await cameraManager.takePicture();
  }
  
  // Check if a detection method is active
  isMethodActive(method: ProximityMethod): boolean {
    switch (method) {
      case ProximityMethod.LOCATION:
        return this.locationEnabled;
      case ProximityMethod.NFC:
        return this.nfcEnabled;
      case ProximityMethod.CAMERA:
        return this.cameraEnabled;
      default:
        return false;
    }
  }
  
  // Check if proximity manager is initialized
  getInitializedStatus(): boolean {
    return this.isInitialized;
  }
  
  // Helper to fetch mock user profile
  private async fetchMockUserProfile(userId: number): Promise<{ username: string, displayName: string }> {
    // In development, generate a random name
    return {
      username: `user${userId}`,
      displayName: this.getRandomName()
    };
  }
  
  // Helper to generate mock nearby users for development
  private generateMockNearbyUsers(count: number, method: ProximityMethod, location?: LocationData): NearbyUser[] {
    const users: NearbyUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const userId = Math.floor(Math.random() * 1000) + 1;
      
      let distance: number | undefined;
      
      if (method === ProximityMethod.LOCATION && location) {
        // Generate a random distance (5-100m)
        distance = Math.floor(Math.random() * 95) + 5;
      }
      
      const user: NearbyUser = {
        userId,
        username: `user${userId}`,
        displayName: this.getRandomName(),
        distance,
        lastSeen: new Date(),
        methods: [method],
        confidence: method === ProximityMethod.LOCATION 
          ? this.calculateLocationConfidence(distance || null)
          : method === ProximityMethod.NFC 
            ? 95 
            : 75, // Different confidence levels by method
        online: Math.random() > 0.2 // 80% chance of being online
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
    
    this.isInitialized = false;
    this.userId = null;
    this.settings = null;
    this.nearbyUsers.clear();
  }
}

// Create and export a singleton instance
export const proximityManager = new ProximityManager();

export default proximityManager;