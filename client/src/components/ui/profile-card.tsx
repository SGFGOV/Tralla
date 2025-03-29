import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VirtualActionButton from "./virtual-action-button";
import { useWebSocket } from "@/hooks/use-web-socket";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils/user-utils";
import { User } from "@shared/schema";

interface ProfileCardProps {
  user: User;
  distance: number;
  isFavorite?: boolean;
}

export default function ProfileCard({ user, distance, isFavorite = false }: ProfileCardProps) {
  const [_, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { sendChatMessage, sendVirtualInteraction } = useWebSocket(currentUser?.id);
  const { toast } = useToast();
  
  const handleProfileView = () => {
    setLocation(`/profile/${user.id}`);
  };
  
  const handleStartChat = () => {
    setLocation(`/chats/${user.id}`);
  };
  
  const handleSendHug = () => {
    sendVirtualInteraction(user.id, 'virtual_hug');
    toast({
      title: "Virtual Hug Sent",
      description: `You sent a virtual hug to ${user.displayName}`,
    });
  };
  
  const handleSendKiss = () => {
    sendVirtualInteraction(user.id, 'virtual_kiss');
    toast({
      title: "Virtual Kiss Sent",
      description: `You sent a virtual kiss to ${user.displayName}`,
    });
  };
  
  return (
    <div className="profile-card bg-white p-4 border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
      <div className="flex">
        <div className="relative">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar} alt={`${user.displayName} profile picture`} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className={`absolute bottom-0 right-0 w-4 h-4 ${
            user.online ? 'bg-success' : 'bg-neutral-400'
          } rounded-full border-2 border-white`}></div>
        </div>
        
        <div className="ml-4 flex-1">
          <div className="flex justify-between">
            <h3 className="font-semibold">{user.displayName}</h3>
            <span className="text-xs text-neutral-500 flex items-center">
              <i className="fas fa-map-marker-alt mr-1"></i>
              <span>{formatDistance(distance)}</span>
            </span>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            {user.bio || "No bio provided."}
          </p>
          <div className="mt-2 flex space-x-2">
            <VirtualActionButton 
              icon="eye" 
              onClick={handleProfileView}
              ariaLabel="View profile"
            />
            <VirtualActionButton 
              icon="comment" 
              onClick={handleStartChat}
              ariaLabel="Start chat"
            />
            <VirtualActionButton 
              icon="hands-heart" 
              onClick={handleSendHug}
              ariaLabel="Send virtual hug"
            />
            <VirtualActionButton 
              icon="kiss-wink-heart" 
              onClick={handleSendKiss}
              ariaLabel="Send virtual kiss"
              variant="accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format distance
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m away`;
  } else {
    const km = (meters / 1000).toFixed(1);
    return `${km}km away`;
  }
}
