import { Platform } from 'react-native';

// Interface for NFC reader session
export interface NfcReaderSession {
  id: string;
  active: boolean;
  startTime: number;
}

// Interface for user profile stored on NFC tag
export interface NfcProfile {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  timestamp: number;
}

// Class to handle NFC interactions
class NfcManagerClass {
  private isInitialized: boolean = false;
  private hasSupport: boolean = false;
  private isScanStarted: boolean = false;
  private currentSession: NfcReaderSession | null = null;
  private onTagDiscoveredCallback: ((tag: any) => Promise<void>) | null = null;
  
  // Initialize NFC manager and check for device support
  async init(): Promise<{ initialized: boolean; error?: string }> {
    try {
      // In a real app, this would check if the device supports NFC:
      // const supported = await NfcManager.isSupported();
      // if (!supported) {
      //   return {
      //     initialized: false,
      //     error: 'NFC is not supported on this device'
      //   };
      // }
      // 
      // await NfcManager.start();
      
      // For simulation, assume we have support based on platform
      this.hasSupport = Platform.OS === 'android' || (Platform.OS === 'ios' && Platform.Version >= '13.0');
      
      if (!this.hasSupport) {
        return {
          initialized: false,
          error: 'NFC is not supported on this device'
        };
      }
      
      this.isInitialized = true;
      
      return {
        initialized: true
      };
    } catch (error) {
      console.error('Error initializing NFC manager:', error);
      return {
        initialized: false,
        error: `Error initializing NFC: ${error}`
      };
    }
  }
  
  // Start NFC reading with callback
  async startReading(onTagDiscovered?: (tag: any) => Promise<void>): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.hasSupport) {
        console.warn('NFC manager not initialized or not supported');
        return false;
      }
      
      if (this.isScanStarted) {
        console.warn('NFC reading already active');
        return true;
      }
      
      // Set callback if provided
      if (onTagDiscovered) {
        this.onTagDiscoveredCallback = onTagDiscovered;
      }
      
      // In a real app, this would register for NFC tag discovery:
      // this.currentSession = {
      //   id: `session-${Date.now()}`,
      //   active: true,
      //   startTime: Date.now()
      // };
      // 
      // if (Platform.OS === 'android') {
      //   NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      //     this.handleTagDiscovered(tag);
      //   });
      //   await NfcManager.registerTagEvent();
      // } else if (Platform.OS === 'ios') {
      //   await NfcManager.requestTechnology(NfcTech.Ndef);
      // }
      
      // For simulation, create a mock session
      this.currentSession = {
        id: `session-${Date.now()}`,
        active: true,
        startTime: Date.now()
      };
      
      this.isScanStarted = true;
      
      // For simulation, periodically generate mock tag discoveries
      this.simulateTagDiscovery();
      
      return true;
    } catch (error) {
      console.error('Error starting NFC reading:', error);
      this.cleanupSession();
      return false;
    }
  }
  
  // Stop NFC reading
  async stopReading(): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.isScanStarted) {
        return true;
      }
      
      // In a real app, this would stop listening for NFC tags:
      // if (Platform.OS === 'android') {
      //   NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      //   await NfcManager.unregisterTagEvent();
      // } else if (Platform.OS === 'ios') {
      //   await NfcManager.cancelTechnologyRequest();
      // }
      
      this.cleanupSession();
      
      return true;
    } catch (error) {
      console.error('Error stopping NFC reading:', error);
      this.cleanupSession();
      return false;
    }
  }
  
  // Read profile data from NFC tag
  async readProfileFromTag(tag?: any): Promise<NfcProfile | null> {
    try {
      if (!this.isInitialized || !this.hasSupport) {
        return null;
      }
      
      // In a real app, this would read the NDEF message from the tag:
      // const ndef = tag.ndefMessage[0];
      // const payload = ndef.payload;
      // const text = new TextDecoder().decode(payload.slice(3));
      // return JSON.parse(text) as NfcProfile;
      
      // For simulation, generate a mock profile
      const profile: NfcProfile = {
        userId: Math.floor(Math.random() * 1000) + 1,
        username: `user${Math.floor(Math.random() * 1000)}`,
        displayName: this.getRandomName(),
        avatarUrl: Math.random() > 0.5 ? `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg` : undefined,
        timestamp: Date.now()
      };
      
      return profile;
    } catch (error) {
      console.error('Error reading profile from NFC tag:', error);
      return null;
    }
  }
  
  // Write profile data to NFC tag
  async writeProfileToTag(profile: NfcProfile): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.hasSupport) {
        return false;
      }
      
      // In a real app, this would write the profile to the tag:
      // const bytes = new TextEncoder().encode(JSON.stringify(profile));
      // const ndef = {
      //   id: [1],
      //   tnf: 3, // Well-known NDEF record
      //   type: [84], // 'T' for TEXT record
      //   payload: [2, 101, 110, ...bytes] // 'en' language code followed by the profile data
      // };
      // 
      // if (Platform.OS === 'android') {
      //   await NfcManager.requestTechnology(NfcTech.Ndef);
      //   await NfcManager.ndefHandler.writeNdefMessage([ndef]);
      //   await NfcManager.cancelTechnologyRequest();
      // } else if (Platform.OS === 'ios') {
      //   await NfcManager.requestTechnology(NfcTech.Ndef);
      //   await NfcManager.ndefHandler.writeNdefMessage([ndef]);
      //   await NfcManager.cancelTechnologyRequest();
      // }
      
      console.log('Profile written to NFC tag:', profile);
      
      return true;
    } catch (error) {
      console.error('Error writing profile to NFC tag:', error);
      return false;
    }
  }
  
  // Handle tag discovered event
  private async handleTagDiscovered(tag: any): Promise<void> {
    try {
      if (!this.isInitialized || !this.isScanStarted) return;
      
      // Read profile data from the tag
      const profile = await this.readProfileFromTag(tag);
      
      // Call the callback if available
      if (profile && this.onTagDiscoveredCallback) {
        await this.onTagDiscoveredCallback(tag);
      }
    } catch (error) {
      console.error('Error handling NFC tag discovery:', error);
    }
  }
  
  // Generate a mock NFC tag for development
  private generateMockTag(): any {
    // Mock NFC tag structure
    return {
      id: Array.from({ length: 8 }, () => Math.floor(Math.random() * 256)),
      techTypes: ['android.nfc.tech.Ndef', 'android.nfc.tech.NdefFormatable'],
      maxSize: 137,
      isWritable: true,
      ndefMessage: [
        {
          id: [1],
          tnf: 3, // Well-known record
          type: [84], // 'T' for TEXT record
          payload: new Uint8Array([2, 101, 110, ...Array.from({ length: 100 }, () => Math.floor(Math.random() * 256))])
        }
      ]
    };
  }
  
  // Simulate tag discovery for development
  private simulateTagDiscovery(): void {
    // Call once immediately
    setTimeout(() => {
      const mockTag = this.generateMockTag();
      this.handleTagDiscovered(mockTag);
    }, 1000);
    
    // Then randomly throughout the session
    const interval = setInterval(() => {
      if (!this.isScanStarted) {
        clearInterval(interval);
        return;
      }
      
      // Simulate occasional tag discoveries (33% chance every 10 seconds)
      if (Math.random() < 0.33) {
        const mockTag = this.generateMockTag();
        this.handleTagDiscovered(mockTag);
      }
    }, 10000);
  }
  
  // Clean up the current session
  private cleanupSession(): void {
    if (this.currentSession) {
      this.currentSession.active = false;
    }
    this.currentSession = null;
    this.isScanStarted = false;
    this.onTagDiscoveredCallback = null;
  }
  
  // Check if NFC reading is active
  isReading(): boolean {
    return this.isScanStarted;
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
    this.stopReading();
    this.isInitialized = false;
    this.hasSupport = false;
    this.isScanStarted = false;
    this.currentSession = null;
    this.onTagDiscoveredCallback = null;
  }
}

// Create and export a singleton instance
export const nfcManager = new NfcManagerClass();

export default nfcManager;