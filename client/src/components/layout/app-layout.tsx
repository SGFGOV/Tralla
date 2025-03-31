import { useEffect } from "react";
import { useDevice } from "@/contexts/device-context";
import DeviceSwitcher from "./device-switcher";
import TabNavigation from "./tab-navigation";
import PhoneFrame from "@/components/device-frames/phone-frame";
import WatchFrame from "@/components/device-frames/watch-frame";
import GlassFrame from "@/components/device-frames/glass-frame";
import { useLocation } from "@/hooks/use-location";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useAuth } from "@/contexts/auth-context";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { device } = useDevice();
  const { user } = useAuth();
  const location = useLocation();
  const { updateLocation } = useWebSocket(user?.id);
  
  // Update location when it changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      updateLocation(location.latitude, location.longitude);
    }
  }, [location, updateLocation]);
  
  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-neutral-100">
      <DeviceSwitcher />
      
      {device === 'phone' && (
        <PhoneFrame>
          <div className="h-full overflow-hidden flex flex-col">
            <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-200">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-neutral-800">Tralla</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-neutral-700">
                  <i className="fas fa-bell"></i>
                </button>
                <button className="text-neutral-700">
                  <i className="fas fa-cog"></i>
                </button>
              </div>
            </header>
            
            <TabNavigation />
            {children}
          </div>
        </PhoneFrame>
      )}
      
      {device === 'watch' && (
        <WatchFrame>
          {location.latitude ? (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-2">
                <div className="text-white text-sm font-bold">Tralla</div>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute w-32 h-32 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <div className="w-28 h-28 bg-primary bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="text-center">
                      <div className="text-white text-3xl font-bold">3</div>
                      <div className="text-white text-xs">nearby</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="bg-neutral-800 py-2 rounded-lg text-white text-xs">
                  <i className="fas fa-eye mb-1 block"></i>
                  View
                </button>
                <button className="bg-primary py-2 rounded-lg text-white text-xs">
                  <i className="fas fa-comment mb-1 block"></i>
                  Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-white text-sm mb-2">
                Location Required
              </div>
              <div className="text-white text-xs text-center opacity-60">
                Enable location to find people nearby
              </div>
            </div>
          )}
        </WatchFrame>
      )}
      
      {device === 'glass' && (
        <GlassFrame>
          <div className="flex items-center space-x-3 opacity-80 mb-2">
            <i className="fas fa-circle text-xs"></i>
            <span className="text-xs">Tralla Active</span>
          </div>
          
          <div className="bg-white bg-opacity-5 p-2 mt-2 rounded">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 ring-2 ring-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="ml-2">
                <div className="text-white text-sm font-medium">Sarah Johnson</div>
                <div className="text-white text-xs opacity-80">12m away • Online</div>
              </div>
              <div className="ml-auto flex space-x-2">
                <button className="p-1 bg-white bg-opacity-10 rounded">
                  <i className="fas fa-comment text-xs"></i>
                </button>
                <button className="p-1 bg-primary bg-opacity-70 rounded">
                  <i className="fas fa-hands-heart text-xs"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <div className="text-xs opacity-70">Look at someone to view their profile</div>
          </div>
        </GlassFrame>
      )}
    </div>
  );
}
