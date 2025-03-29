import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });
  
  const { toast } = useToast();

  // Function to get current position
  const getCurrentPosition = useCallback(() => {
    setLocation(prev => ({ ...prev, loading: true }));
    
    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setLocation({
          latitude: null,
          longitude: null,
          error: error.message,
          loading: false,
        });
        
        toast({
          title: "Location Error",
          description: error.message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [toast]);

  // Get location on component mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Mock location (for testing or simulator)
  const setMockLocation = useCallback((latitude: number, longitude: number) => {
    setLocation({
      latitude,
      longitude,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...location,
    getCurrentPosition,
    setMockLocation,
  };
}
