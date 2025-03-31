import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../../contexts/auth-context";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PrivacySettings {
  id?: number;
  userId: number;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  allowFriendRequests: boolean;
  allowProximityDiscovery: boolean;
  allowLocationSharing: boolean;
  showBirthday: boolean;
  showEmail: boolean;
  profileVisibility: string; // "public", "friends", "private"
  messagesFromNonFriends: boolean;
}

export default function PrivacySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    userId: user?.id || 0,
    showOnlineStatus: true,
    showLastActive: true,
    allowFriendRequests: true,
    allowProximityDiscovery: true,
    allowLocationSharing: true,
    showBirthday: false,
    showEmail: false,
    profileVisibility: "public",
    messagesFromNonFriends: true
  });

  // Load existing privacy settings
  useEffect(() => {
    if (!user?.id) return;

    const fetchPrivacySettings = async () => {
      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/privacy-settings`);
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
        // If settings don't exist, we'll use the defaults initialized above
      }
    };

    fetchPrivacySettings();
  }, [user?.id]);

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const saveSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const method = settings.id ? 'PATCH' : 'POST';
      const response = await apiRequest(
        method, 
        `/api/users/${user.id}/privacy-settings`,
        settings
      );
      
      const data = await response.json();
      setSettings(data);
      
      toast({
        title: "Privacy settings updated",
        description: "Your profile privacy settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Privacy Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="online-status-privacy" className="text-sm font-medium">
              Online Status
            </Label>
            <Switch
              id="online-status-privacy"
              checked={settings.showOnlineStatus}
              onCheckedChange={() => handleToggle('showOnlineStatus')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Show when you are currently online to other users.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="last-active-privacy" className="text-sm font-medium">
              Last Active Status
            </Label>
            <Switch
              id="last-active-privacy"
              checked={settings.showLastActive}
              onCheckedChange={() => handleToggle('showLastActive')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Show when you were last active on the platform.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="friend-requests-privacy" className="text-sm font-medium">
              Friend Requests
            </Label>
            <Switch
              id="friend-requests-privacy"
              checked={settings.allowFriendRequests}
              onCheckedChange={() => handleToggle('allowFriendRequests')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow others to send you friend requests.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="proximity-discovery-privacy" className="text-sm font-medium">
              Proximity Discovery
            </Label>
            <Switch
              id="proximity-discovery-privacy"
              checked={settings.allowProximityDiscovery}
              onCheckedChange={() => handleToggle('allowProximityDiscovery')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow others to discover you when you're nearby.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="location-sharing-privacy" className="text-sm font-medium">
              Location Sharing
            </Label>
            <Switch
              id="location-sharing-privacy"
              checked={settings.allowLocationSharing}
              onCheckedChange={() => handleToggle('allowLocationSharing')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow the app to share your location for proximity features.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="birthday-privacy" className="text-sm font-medium">
              Birthday
            </Label>
            <Switch
              id="birthday-privacy"
              checked={settings.showBirthday}
              onCheckedChange={() => handleToggle('showBirthday')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Show your birthday to other users.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-privacy" className="text-sm font-medium">
              Email Address
            </Label>
            <Switch
              id="email-privacy"
              checked={settings.showEmail}
              onCheckedChange={() => handleToggle('showEmail')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Show your email address to other users. This is not recommended.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="profile-visibility" className="text-sm font-medium">
              Profile Visibility
            </Label>
            <Select 
              value={settings.profileVisibility}
              onValueChange={(value) => setSettings(prev => ({ ...prev, profileVisibility: value }))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Control who can view your full profile information.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="non-friend-messages" className="text-sm font-medium">
              Messages from Non-Friends
            </Label>
            <Switch
              id="non-friend-messages"
              checked={settings.messagesFromNonFriends}
              onCheckedChange={() => handleToggle('messagesFromNonFriends')}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow people who are not your connections to send you messages.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveSettings} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}