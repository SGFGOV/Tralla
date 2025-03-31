import React from "react";

interface GlassFrameProps {
  children: React.ReactNode;
}

export default function GlassFrame({ children }: GlassFrameProps) {
  return (
    <div className="glass-frame bg-black bg-opacity-70 w-full max-w-[400px] h-auto aspect-video relative rounded-lg shadow-lg">
      <div className="h-full p-3 overflow-hidden text-white">
        {children}
      </div>
    </div>
  );
}
