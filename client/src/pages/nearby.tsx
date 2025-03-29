import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { useLocation } from "@/hooks/use-location";
import { useWebSocket } from "@/hooks/use-web-socket";
import ProximitySearch from "@/components/ui/proximity-search";
import ProfileCard from "@/components/ui/profile-card";
import { useToast } from "@/hooks/use-toast";

export default function Nearby() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  const { 
    connected, 
    nearbyUsers, 
    updateLocation, 
    virtualInteraction,
    resetVirtualInteraction
  } = useWebSocket(user?.id);

  // Query for proximity settings
  const { data: proximitySettings } = useQuery({ 
    queryKey: [`/api/users/${user?.id}/proximity-settings`],
    enabled: !!user?.id,
  });

  // Update location when it changes
  useEffect(() => {
    if (connected && location.latitude && location.longitude) {
      updateLocation(location.latitude, location.longitude);
    }
  }, [connected, location.latitude, location.longitude, updateLocation]);

  // Show virtual interaction toast
  useEffect(() => {
    if (virtualInteraction) {
      toast({
        title: `${virtualInteraction.sender.displayName} sent you a ${
          virtualInteraction.message.type === 'virtual_hug' ? 'virtual hug' : 'virtual kiss'
        }`,
        description: "Proximity connections are working!",
      });
      resetVirtualInteraction();
    }
  }, [virtualInteraction, toast, resetVirtualInteraction]);

  // Handle location errors
  useEffect(() => {
    if (location.error) {
      toast({
        title: "Location Error",
        description: "Unable to get your location. Some features might not work properly.",
        variant: "destructive",
      });
    }
  }, [location.error, toast]);

  // Handle radius change
  const handleRadiusChange = async (radius: number) => {
    try {
      await fetch(`/api/users/${user?.id}/proximity-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ radius }),
      });

      // Update location to trigger a refresh of nearby users
      if (location.latitude && location.longitude) {
        updateLocation(location.latitude, location.longitude);
      }
    } catch (error) {
      console.error("Error updating radius:", error);
      toast({
        title: "Error",
        description: "Failed to update search radius",
        variant: "destructive",
      });
    }
  };

  if (location.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-neutral-600">Finding people nearby...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ProximitySearch
        radius={proximitySettings?.radius || 100}
        onRadiusChange={handleRadiusChange}
      />
      
      {nearbyUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-800">No one nearby</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try increasing your search radius or move to a more populated area
          </p>
        </div>
      ) : (
        <div>
          {nearbyUsers.map((nearbyUser) => (
            <ProfileCard 
              key={nearbyUser.id}
              user={nearbyUser}
              distance={Math.round(
                calculateDistance(
                  location.latitude!, 
                  location.longitude!, 
                  nearbyUser.location?.latitude, 
                  nearbyUser.location?.longitude
                )
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to calculate distance in meters
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number | undefined, 
  lon2: number | undefined
): number {
  if (!lat2 || !lon2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance * 1000; // Convert to meters
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
