import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VirtualActionButtonProps {
  icon: string;
  onClick: () => void;
  ariaLabel: string;
  variant?: "default" | "accent";
}

export default function VirtualActionButton({ 
  icon, 
  onClick, 
  ariaLabel,
  variant = "default" 
}: VirtualActionButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleClick = () => {
    setIsAnimating(true);
    onClick();
    
    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      className={cn(
        "virtual-action-btn p-2 rounded-full transition-all",
        isAnimating && "scale-90",
        variant === "default" ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "",
        variant === "accent" ? "bg-accent text-white hover:bg-opacity-90" : ""
      )}
      onClick={handleClick}
    >
      <i className={`fas fa-${icon}`}></i>
    </Button>
  );
}
