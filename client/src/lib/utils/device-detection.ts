// Detect device type based on user agent
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent;
  
  // Check for mobile
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) &&
    !/iPad/i.test(userAgent)
  ) {
    // Check screen size to distinguish between phone and tablet
    if (window.innerWidth < 768) {
      return 'mobile';
    } else {
      return 'tablet';
    }
  }
  
  // Check for tablet
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) {
    return 'tablet';
  }
  
  // Default to desktop
  return 'desktop';
}

// Check if device supports Bluetooth
export function supportsWebBluetooth(): boolean {
  return 'bluetooth' in navigator;
}

// Check if device has GPS capabilities
export function supportsGeolocation(): boolean {
  return 'geolocation' in navigator;
}

// Check if device likely supports AR capabilities
export function supportsAR(): boolean {
  // This is a very basic check, real AR detection would be more complex
  // Check for some AR-related APIs
  return 'xr' in navigator || 'WebXRSession' in window;
}

// Check if device has camera access
export function supportsCamera(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Check if device is a wearable (simulated)
export function isWearable(): boolean {
  // This is just a simulation - real wearable detection would be device-specific
  const screen = window.screen;
  return screen.width < 200 && screen.height < 200;
}
