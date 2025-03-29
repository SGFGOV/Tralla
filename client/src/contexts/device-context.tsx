import React, { createContext, useState, useContext, useEffect } from 'react';
import { detectDeviceType } from '@/lib/utils/device-detection';
import { DEVICE_TYPES, STORAGE_KEYS } from '@/lib/constants';

type DeviceType = 'phone' | 'watch' | 'glass';

interface DeviceContextType {
  device: DeviceType;
  setDevice: (device: DeviceType) => void;
  isMobile: boolean;
  isWatch: boolean;
  isGlass: boolean;
  deviceSupportsFeature: (feature: 'bluetooth' | 'geolocation' | 'camera' | 'ar') => boolean;
}

// Create context with default values
export const DeviceContext = createContext<DeviceContextType>({
  device: DEVICE_TYPES.PHONE as DeviceType,
  setDevice: () => {},
  isMobile: true,
  isWatch: false,
  isGlass: false,
  deviceSupportsFeature: () => false,
});

// Device provider component
export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize device type based on stored preference or detected device
  const [device, setDeviceState] = useState<DeviceType>(() => {
    // Try to get from localStorage first
    const storedDevice = localStorage.getItem(STORAGE_KEYS.DEVICE_PREFERENCE) as DeviceType | null;
    
    if (storedDevice && Object.values(DEVICE_TYPES).includes(storedDevice as any)) {
      return storedDevice;
    }
    
    // Fall back to detection
    const detectedType = detectDeviceType();
    return detectedType === 'mobile' ? DEVICE_TYPES.PHONE as DeviceType : DEVICE_TYPES.PHONE as DeviceType;
  });
  
  // Set device and store preference
  const setDevice = (newDevice: DeviceType) => {
    setDeviceState(newDevice);
    localStorage.setItem(STORAGE_KEYS.DEVICE_PREFERENCE, newDevice);
  };
  
  // Computed properties
  const isMobile = device === DEVICE_TYPES.PHONE;
  const isWatch = device === DEVICE_TYPES.WATCH;
  const isGlass = device === DEVICE_TYPES.GLASS;
  
  // Feature detection
  const deviceSupportsFeature = (feature: 'bluetooth' | 'geolocation' | 'camera' | 'ar'): boolean => {
    switch (feature) {
      case 'bluetooth':
        return 'bluetooth' in navigator;
      case 'geolocation':
        return 'geolocation' in navigator;
      case 'camera':
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      case 'ar':
        return 'xr' in navigator || 'WebXRSession' in window;
      default:
        return false;
    }
  };
  
  return (
    <DeviceContext.Provider 
      value={{ 
        device, 
        setDevice, 
        isMobile, 
        isWatch, 
        isGlass,
        deviceSupportsFeature
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

// Custom hook for using device context
export const useDevice = () => useContext(DeviceContext);
