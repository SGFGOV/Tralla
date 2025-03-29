import React from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="device-frame bg-white w-[375px] h-[812px] relative">
      {children}
    </div>
  );
}
