import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { useLocation } from "wouter";
import { useWebSocket } from "@/hooks/use-web-socket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils/user-utils";
import { User } from "@shared/schema";

interface ProfileDetailProps {
  id: number;
}

export default function ProfileDetail({ id }: ProfileDetailProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const { sendChatMessage, sendVirtualInteraction } = useWebSocket(user?.id);
  const { toast } = useToast();

  // Query profile
  const { data: profile, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id && id !== user?.id,
  });

  // Query friendship status
  const { data: friendship } = useQuery({
    queryKey: [`/api/friend-requests/${user?.id}/${id}/status`],
    enabled: !!user?.id && !!id && id !== user?.id,
  });

  // Create friend request mutation
  const createFriendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/friend-requests', {
        userId: user!.id,
        friendId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friend-requests/${user?.id}/${id}/status`] });
      toast({
        title: "Friend Request Sent",
        description: `Your request has been sent to ${profile?.displayName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send friend request: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Accept friend request mutation
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/friend-requests/${user?.id}/${id}/status`, {
        status: 'accepted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friend-requests/${user?.id}/${id}/status`] });
      toast({
        title: "Friend Request Accepted",
        description: `You are now friends with ${profile?.displayName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to accept friend request: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleMessage = () => {
    navigate(`/chats/${id}`);
  };

  const handleSendVirtualHug = () => {
    sendVirtualInteraction(id, 'virtual_hug');
    toast({
      title: "Virtual Hug Sent",
      description: `You sent a virtual hug to ${profile?.displayName}`,
    });
  };

  const handleSendVirtualKiss = () => {
    sendVirtualInteraction(id, 'virtual_kiss');
    toast({
      title: "Virtual Kiss Sent",
      description: `You sent a virtual kiss to ${profile?.displayName}`,
    });
  };

  const handleFriendRequest = () => {
    if (!friendship) {
      createFriendRequestMutation.mutate();
    } else if (friendship.status === 'pending' && friendship.friendId === user?.id) {
      acceptFriendRequestMutation.mutate();
    }
  };

  // Handle if trying to view own profile
  if (id === user?.id) {
    navigate('/profile');
    return null;
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine friendship button text
  let friendshipButtonText = "Add Friend";
  let isFriendshipButtonDisabled = false;
  
  if (friendship) {
    if (friendship.status === 'accepted') {
      friendshipButtonText = "Friends";
      isFriendshipButtonDisabled = true;
    } else if (friendship.status === 'pending') {
      if (friendship.userId === user?.id) {
        friendshipButtonText = "Request Sent";
        isFriendshipButtonDisabled = true;
      } else {
        friendshipButtonText = "Accept Request";
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center border-b border-neutral-200">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate('/nearby')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <h2 className="font-semibold text-neutral-800">Profile</h2>
      </header>

      <div className="flex-1 overflow-y-auto bg-white">
        {/* Profile Hero */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary to-secondary"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-end">
              <Avatar className="w-20 h-20 border-2 border-white">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h1 className="text-white text-xl font-bold">{profile.displayName}</h1>
                <div className="flex items-center text-white text-sm mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{profile.location ? "Nearby" : "Location unknown"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex p-4 border-b border-neutral-200">
          <Button 
            className="flex-1 mx-1"
            onClick={handleMessage}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Message
          </Button>
          <Button 
            variant="secondary"
            className="flex-1 mx-1"
            disabled={isFriendshipButtonDisabled}
            onClick={handleFriendRequest}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {friendshipButtonText}
          </Button>
        </div>
        
        {/* Virtual Interactions */}
        <div className="flex p-4 border-b border-neutral-200">
          <Button 
            variant="outline" 
            className="flex-1 mx-1" 
            onClick={handleSendVirtualHug}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            Send Hug
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 mx-1" 
            onClick={handleSendVirtualKiss}
          >
            <i className="fas fa-kiss-wink-heart text-primary mr-2"></i>
            Send Kiss
          </Button>
        </div>
        
        {/* Profile Details */}
        <div className="p-4">
          {/* About */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">About</h2>
            <p className="text-neutral-600">
              {profile.bio || "No bio provided."}
            </p>
          </div>
          
          {/* Interests */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">Interests</h2>
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <div key={index} className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                    {interest}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No interests listed.</p>
            )}
          </div>
          
          {/* Common Interests */}
          {profile.interests && user?.interests && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-800 mb-2">Common Interests</h2>
              
              {(() => {
                const commonInterests = profile.interests.filter(i => 
                  user.interests && user.interests.includes(i)
                );
                
                if (commonInterests.length > 0) {
                  return (
                    <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
                      <div className="text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-800">
                          You both like {commonInterests.join(' and ')}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {commonInterests.length} shared {commonInterests.length === 1 ? 'interest' : 'interests'}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <p className="text-sm text-neutral-500">No common interests found.</p>
                  );
                }
              })()}
            </div>
          )}
          
          <Separator className="my-4" />
          
          {/* Report user button */}
          <Button 
            variant="ghost" 
            className="w-full text-neutral-600" 
            onClick={() => toast({
              title: "Report Submitted",
              description: "Thank you for helping keep our community safe.",
            })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Report User
          </Button>
        </div>
      </div>
    </div>
  );
}
