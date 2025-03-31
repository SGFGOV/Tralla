import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/contexts/device-context";

export default function DeviceSwitcher() {
  const { device, setDevice } = useDevice();
  
  const switchDevice = (newDevice: 'phone' | 'watch' | 'glass') => {
    setDevice(newDevice);
  };
  
  return (
    <div className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-md px-2 py-1 z-50 flex space-x-1 sm:space-x-3 sm:px-3">
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 ${device === 'phone' ? 'text-primary' : 'text-neutral-600'}`}
        onClick={() => switchDevice('phone')}
      >
        <i className="fas fa-mobile-alt mr-1"></i> 
        <span className="hidden sm:inline">Phone</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 ${device === 'watch' ? 'text-primary' : 'text-neutral-600'}`}
        onClick={() => switchDevice('watch')}
      >
        <i className="fas fa-watch mr-1"></i> 
        <span className="hidden sm:inline">Watch</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-full text-xs sm:text-sm px-2 sm:px-3 ${device === 'glass' ? 'text-primary' : 'text-neutral-600'}`}
        onClick={() => switchDevice('glass')}
      >
        <i className="fas fa-glasses mr-1"></i> 
        <span className="hidden sm:inline">Glass</span>
      </Button>
    </div>
  );
}
