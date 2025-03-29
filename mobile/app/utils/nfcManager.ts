import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { Platform } from 'react-native';

// Class to handle NFC operations
class NfcHandler {
  private isSupported: boolean = false;
  private isInitialized: boolean = false;
  private isEnabled: boolean = false;

  // Initialize NFC manager
  async init() {
    try {
      // Check if the device supports NFC
      this.isSupported = await NfcManager.isSupported();
      
      if (this.isSupported) {
        // Start the NFC manager
        await NfcManager.start();
        this.isInitialized = true;
        
        // Check if NFC is enabled (Android only)
        if (Platform.OS === 'android') {
          this.isEnabled = await NfcManager.isEnabled();
        } else {
          // On iOS we assume it's enabled if supported
          this.isEnabled = true;
        }
        
        return {
          supported: this.isSupported,
          initialized: this.isInitialized,
          enabled: this.isEnabled
        };
      } else {
        return {
          supported: false,
          initialized: false,
          enabled: false,
          error: 'NFC is not supported on this device'
        };
      }
    } catch (error) {
      console.error('Error initializing NFC manager:', error);
      return {
        supported: false,
        initialized: false,
        enabled: false,
        error: `Error initializing NFC: ${error}`
      };
    }
  }

  // Clean up NFC resources
  async cleanup() {
    if (this.isInitialized) {
      await NfcManager.cancelTechnologyRequest();
      await NfcManager.unregisterTagEvent();
      this.isInitialized = false;
    }
  }

  // Start reading NFC tags
  async startReading(onTagDiscovered: (tag: any) => void) {
    if (!this.isSupported || !this.isInitialized || !this.isEnabled) {
      throw new Error('NFC is not available or not initialized');
    }

    try {
      // Register for tag discoveries
      await NfcManager.registerTagEvent();
      
      // Set up the listener for when a tag is discovered
      NfcManager.setEventListener(NfcManager.EventType.DiscoverTag, (tag: any) => {
        onTagDiscovered(tag);
      });
      
      return true;
    } catch (error) {
      console.error('Error starting NFC reading:', error);
      throw error;
    }
  }

  // Stop reading NFC tags
  async stopReading() {
    if (this.isInitialized) {
      try {
        await NfcManager.unregisterTagEvent();
        NfcManager.setEventListener(NfcManager.EventType.DiscoverTag, null);
        return true;
      } catch (error) {
        console.error('Error stopping NFC reading:', error);
        throw error;
      }
    }
    return false;
  }

  // Write user data to NFC tag
  async writeProfileToTag(userId: number, username: string) {
    if (!this.isSupported || !this.isInitialized || !this.isEnabled) {
      throw new Error('NFC is not available or not initialized');
    }

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // Create NDEF message with user data
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(JSON.stringify({ userId, username, app: 'Tralla' }))
      ]);
      
      if (bytes) {
        // Write NDEF message to the tag
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        await NfcManager.cancelTechnologyRequest();
        return true;
      } else {
        throw new Error('Failed to encode NDEF message');
      }
    } catch (error) {
      console.error('Error writing to NFC tag:', error);
      
      // Make sure to cancel any pending tech request
      NfcManager.cancelTechnologyRequest();
      throw error;
    }
  }

  // Read user data from NFC tag
  async readProfileFromTag() {
    if (!this.isSupported || !this.isInitialized || !this.isEnabled) {
      throw new Error('NFC is not available or not initialized');
    }

    try {
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      // Read NDEF message from the tag
      const tag = await NfcManager.getTag();
      await NfcManager.cancelTechnologyRequest();
      
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        // Parse NDEF message
        const ndefRecord = tag.ndefMessage[0];
        const textData = Ndef.text.decodePayload(ndefRecord.payload);
        
        try {
          // Parse JSON data from NDEF record
          const userData = JSON.parse(textData);
          return userData;
        } catch (parseError) {
          console.error('Error parsing NFC data:', parseError);
          throw new Error('Invalid user data format');
        }
      } else {
        throw new Error('No NDEF messages found on tag');
      }
    } catch (error) {
      console.error('Error reading from NFC tag:', error);
      
      // Make sure to cancel any pending tech request
      NfcManager.cancelTechnologyRequest();
      throw error;
    }
  }

  // Enable foreground dispatch for NFC reading (Android only)
  async enableForegroundDispatch() {
    if (Platform.OS === 'android' && this.isInitialized) {
      try {
        await NfcManager.setAnalogForegroundDispatch();
        return true;
      } catch (error) {
        console.error('Error enabling foreground dispatch:', error);
        throw error;
      }
    }
    return false;
  }

  // Disable foreground dispatch for NFC reading (Android only)
  async disableForegroundDispatch() {
    if (Platform.OS === 'android' && this.isInitialized) {
      try {
        await NfcManager.disableForegroundDispatch();
        return true;
      } catch (error) {
        console.error('Error disabling foreground dispatch:', error);
        throw error;
      }
    }
    return false;
  }

  // Check if NFC is supported and available
  async isNfcAvailable() {
    if (!this.isInitialized) {
      await this.init();
    }
    
    return {
      supported: this.isSupported,
      enabled: this.isEnabled
    };
  }
}

// Create and export a singleton instance
export const nfcManager = new NfcHandler();

export default nfcManager;