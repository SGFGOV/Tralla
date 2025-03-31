import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="device-frame bg-white w-full max-w-[375px] h-[calc(100vh-4rem)] max-h-[812px] relative overflow-hidden rounded-2xl shadow-lg">
      {children}
    </div>
  );
}
