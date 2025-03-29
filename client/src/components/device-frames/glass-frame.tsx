import React from "react";

interface GlassFrameProps {
  children: React.ReactNode;
}

export default function GlassFrame({ children }: GlassFrameProps) {
  return (
    <div className="glass-frame bg-black bg-opacity-70 w-[400px] h-[225px] relative">
      <div className="h-full p-3 overflow-hidden text-white">
        {children}
      </div>
    </div>
  );
}
