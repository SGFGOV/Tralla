import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BirthdayReminder from "@/components/ui/birthday-reminder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils/user-utils";
import GiftSuggestion from "@/components/ui/gift-suggestion";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    interests: user?.interests ? user?.interests.join(", ") : "",
    avatar: user?.avatar || "",
  });

  // Query for proximity settings
  const { data: proximitySettings } = useQuery({
    queryKey: [`/api/users/${user?.id}/proximity-settings`],
    enabled: !!user?.id,
  });

  // Query for friends
  const { data: friends = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/friends`],
    enabled: !!user?.id,
  });

  // Query for frequent contacts
  const { data: frequentContacts = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/frequent-contacts`],
    enabled: !!user?.id,
  });

  // Mutation for updating proximity settings
  const updateProximitySettingsMutation = useMutation({
    mutationFn: async (data: { visible: boolean; shareLocation: boolean }) => {
      return apiRequest('PATCH', `/api/users/${user?.id}/proximity-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/proximity-settings`] });
      toast({
        title: "Settings Updated",
        description: "Your privacy settings have been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; bio: string; interests: string[]; avatar: string }) => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, data);
    },
    onSuccess: (data) => {
      // Update user in context
      updateUser(data);
      setEditDialogOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const interests = editedProfile.interests
      .split(",")
      .map(i => i.trim())
      .filter(i => i !== "");
      
    updateProfileMutation.mutate({
      displayName: editedProfile.displayName,
      bio: editedProfile.bio,
      interests,
      avatar: editedProfile.avatar,
    });
  };

  const handleVisibilityChange = (checked: boolean) => {
    updateProximitySettingsMutation.mutate({
      visible: checked,
      shareLocation: proximitySettings?.shareLocation || false,
    });
  };

  const handleLocationSharingChange = (checked: boolean) => {
    updateProximitySettingsMutation.mutate({
      visible: proximitySettings?.visible || false,
      shareLocation: checked,
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <Avatar className="w-24 h-24 border-4 border-white">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute top-4 right-4">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={editedProfile.displayName}
                      onChange={(e) => setEditedProfile({...editedProfile, displayName: e.target.value})}
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editedProfile.bio}
                      onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests (comma separated)</Label>
                    <Input
                      id="interests"
                      value={editedProfile.interests}
                      onChange={(e) => setEditedProfile({...editedProfile, interests: e.target.value})}
                      placeholder="Photography, Hiking, Coffee, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={editedProfile.avatar}
                      onChange={(e) => setEditedProfile({...editedProfile, avatar: e.target.value})}
                      placeholder="URL to your avatar image"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Profile Details */}
        <div className="pt-16 px-4">
          <h2 className="text-center text-xl font-bold text-neutral-800">{user.displayName}</h2>
          <p className="text-center text-neutral-500 mt-1">@{user.username}</p>
          
          {/* Stats */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{friends.length}</div>
              <div className="text-xs text-neutral-500">Connections</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {user.groups?.length || 0}
              </div>
              <div className="text-xs text-neutral-500">Groups</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {user.activities?.length || 0}
              </div>
              <div className="text-xs text-neutral-500">Events</div>
            </div>
          </div>
          
          {/* Bio */}
          <div className="mt-6 pb-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-800">About Me</h3>
            <p className="text-sm text-neutral-600 mt-2">
              {user.bio || "No bio provided yet. Click edit to add one!"}
            </p>
          </div>
          
          {/* Interests */}
          <div className="mt-4 pb-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-800">Interests</h3>
            {user.interests && user.interests.length > 0 ? (
              <div className="flex flex-wrap mt-2 gap-2">
                {user.interests.map((interest, index) => (
                  <div key={index} className="px-3 py-1 bg-neutral-100 rounded-full text-sm text-neutral-700">
                    {interest}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 mt-2">No interests added yet.</p>
            )}
          </div>
          
          {/* Birthday reminders */}
          {frequentContacts.length > 0 && (
            <div className="mt-4 pb-4 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-800">Upcoming Birthdays</h3>
              <div className="mt-2">
                <BirthdayReminder contacts={frequentContacts.map(f => f.friend)} />
              </div>
            </div>
          )}
          
          {/* Gift suggestions */}
          {frequentContacts.length > 0 && (
            <div className="mt-4 pb-4 border-b border-neutral-200">
              <h3 className="font-semibold text-neutral-800">Gift Ideas</h3>
              <div className="mt-2">
                <GiftSuggestion userId={frequentContacts[0].friend.id} />
              </div>
            </div>
          )}
          
          {/* Privacy Settings Preview */}
          <div className="mt-4 pb-4">
            <h3 className="font-semibold text-neutral-800">Privacy</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">Profile Visibility</h4>
                  <p className="text-xs text-neutral-500">Allow people nearby to see your profile</p>
                </div>
                <Switch
                  checked={proximitySettings?.visible || false}
                  onCheckedChange={handleVisibilityChange}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">Location Sharing</h4>
                  <p className="text-xs text-neutral-500">Share location when using the app</p>
                </div>
                <Switch
                  checked={proximitySettings?.shareLocation || false}
                  onCheckedChange={handleLocationSharingChange}
                />
              </div>
            </div>
          </div>
          
          {/* Logout */}
          <div className="mt-4 pb-8">
            <Button 
              variant="outline" 
              className="w-full text-neutral-700" 
              onClick={() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
