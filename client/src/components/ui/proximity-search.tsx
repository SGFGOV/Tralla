import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

interface ProximitySearchProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
}

export default function ProximitySearch({ radius, onRadiusChange }: ProximitySearchProps) {
  const [localRadius, setLocalRadius] = useState(radius);
  
  // Update local radius when prop changes
  useEffect(() => {
    setLocalRadius(radius);
  }, [radius]);
  
  // Handle slider change with debouncing
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setLocalRadius(newRadius);
    
    // Debounce the actual API call
    const handler = setTimeout(() => {
      onRadiusChange(newRadius);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  };
  
  return (
    <div className="bg-white p-4 border-b border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-neutral-800">People Nearby</h2>
        <div className="text-sm text-primary font-medium">
          <i className="fas fa-sliders mr-1"></i> Filter
        </div>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-neutral-600 mr-2">Range:</span>
        <Slider
          value={[localRadius]}
          min={10}
          max={1000}
          step={10}
          className="flex-1"
          onValueChange={handleRadiusChange}
        />
        <span className="text-sm font-medium text-neutral-700 ml-2 min-w-[50px]">
          {localRadius >= 1000 ? '1km+' : `${localRadius}m`}
        </span>
      </div>
    </div>
  );
}
