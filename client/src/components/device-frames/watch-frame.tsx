import React from "react";

interface WatchFrameProps {
  children: React.ReactNode;
}

export default function WatchFrame({ children }: WatchFrameProps) {
  return (
    <div className="smartwatch-frame bg-black w-full max-w-[300px] h-auto aspect-square relative rounded-full overflow-hidden shadow-lg">
      <div className="h-full p-3 overflow-hidden flex flex-col">
        <header className="flex justify-between items-center mb-2">
          <div className="text-white text-xs">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div className="text-white text-xs">
            <i className="fas fa-signal mr-1"></i>
            <i className="fas fa-battery-three-quarters"></i>
          </div>
        </header>
        
        {children}
      </div>
    </div>
  );
}
