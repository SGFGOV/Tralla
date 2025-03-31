import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../../contexts/auth-context";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { X, Plus } from "lucide-react";
import { 
  SiInstagram, SiFacebook, SiX, SiTiktok, 
  SiSnapchat, SiWhatsapp, SiDiscord, SiLinkedin, 
  SiYoutube, SiPinterest, SiReddit, SiTelegram 
} from "react-icons/si";

interface SocialMediaAccount {
  id?: number;
  userId: number;
  platform: string;
  username: string;
  displayName?: string | null;
  profileUrl?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiry?: Date | null;
  isVerified?: boolean;
  isPublic?: boolean;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: SiInstagram, color: '#E1306C', urlPattern: 'https://instagram.com/{username}' },
  { id: 'facebook', name: 'Facebook', icon: SiFacebook, color: '#1877F2', urlPattern: 'https://facebook.com/{username}' },
  { id: 'twitter', name: 'X / Twitter', icon: SiX, color: '#000000', urlPattern: 'https://twitter.com/{username}' },
  { id: 'tiktok', name: 'TikTok', icon: SiTiktok, color: '#000000', urlPattern: 'https://tiktok.com/@{username}' },
  { id: 'snapchat', name: 'Snapchat', icon: SiSnapchat, color: '#FFFC00', urlPattern: 'https://snapchat.com/add/{username}' },
  { id: 'whatsapp', name: 'WhatsApp', icon: SiWhatsapp, color: '#25D366', urlPattern: 'https://wa.me/{username}' },
  { id: 'discord', name: 'Discord', icon: SiDiscord, color: '#5865F2', urlPattern: 'https://discord.com/users/{username}' },
  { id: 'linkedin', name: 'LinkedIn', icon: SiLinkedin, color: '#0A66C2', urlPattern: 'https://linkedin.com/in/{username}' },
  { id: 'youtube', name: 'YouTube', icon: SiYoutube, color: '#FF0000', urlPattern: 'https://youtube.com/@{username}' },
  { id: 'pinterest', name: 'Pinterest', icon: SiPinterest, color: '#E60023', urlPattern: 'https://pinterest.com/{username}' },
  { id: 'reddit', name: 'Reddit', icon: SiReddit, color: '#FF4500', urlPattern: 'https://reddit.com/user/{username}' },
  { id: 'telegram', name: 'Telegram', icon: SiTelegram, color: '#0088CC', urlPattern: 'https://t.me/{username}' },
];

export default function SocialMediaLinks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [newAccount, setNewAccount] = useState<SocialMediaAccount>({
    userId: user?.id || 0,
    platform: PLATFORMS[0].id,
    username: '',
    profileUrl: '',
    isPublic: true
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Load existing social media accounts
  useEffect(() => {
    if (!user?.id) return;

    const fetchSocialMediaAccounts = async () => {
      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/social-media-accounts`);
        const data = await response.json();
        setAccounts(data || []);
      } catch (error) {
        console.error("Error fetching social media accounts:", error);
      }
    };

    fetchSocialMediaAccounts();
  }, [user?.id]);

  const handlePlatformChange = (platform: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    setNewAccount(prev => ({
      ...prev,
      platform,
      profileUrl: platformInfo ? platformInfo.urlPattern.replace('{username}', prev.username) : null
    }));
  };

  const handleUsernameChange = (username: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === newAccount.platform);
    setNewAccount(prev => ({
      ...prev,
      username,
      profileUrl: platformInfo ? platformInfo.urlPattern.replace('{username}', username) : null
    }));
  };

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/social-media-accounts`, {
        ...newAccount,
        userId: user.id
      });
      
      const data = await response.json();
      setAccounts(prev => [...prev, data]);
      
      // Reset form
      setNewAccount({
        userId: user.id,
        platform: PLATFORMS[0].id,
        username: '',
        profileUrl: null,
        isPublic: true
      });
      setShowAddForm(false);
      
      toast({
        title: "Account added",
        description: `Your ${data.platform} account has been linked successfully.`,
      });
    } catch (error) {
      console.error("Error adding social media account:", error);
      toast({
        title: "Error",
        description: "Failed to add social media account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (id: number | undefined) => {
    if (!id) return;
    
    try {
      await apiRequest('DELETE', `/api/social-media-accounts/${id}`);
      setAccounts(prev => prev.filter(account => account.id !== id));
      
      toast({
        title: "Account removed",
        description: "Your social media account has been unlinked.",
      });
    } catch (error) {
      console.error("Error removing social media account:", error);
      toast({
        title: "Error",
        description: "Failed to remove social media account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = async (id: number | undefined, isPublic: boolean) => {
    if (!id) return;
    
    try {
      const response = await apiRequest('PATCH', `/api/social-media-accounts/${id}`, {
        isPublic: !isPublic
      });
      
      const data = await response.json();
      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, isPublic: data.isPublic } : account
      ));
    } catch (error) {
      console.error("Error updating social media account visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update account visibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get icon component for a platform
  const getPlatformIcon = (platform: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    if (!platformInfo) return null;
    
    const IconComponent = platformInfo.icon;
    return <IconComponent style={{ color: platformInfo.color }} />;
  };

  // Get platform display name
  const getPlatformName = (platform: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    return platformInfo ? platformInfo.name : platform;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Social Media Accounts</CardTitle>
        <Button 
          size="sm"
          variant={showAddForm ? "outline" : "default"}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </>
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showAddForm && (
          <form onSubmit={addAccount} className="space-y-4 border rounded-md p-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <select 
                id="platform"
                value={newAccount.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PLATFORMS.map(platform => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newAccount.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder={`Your ${getPlatformName(newAccount.platform)} username`}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !newAccount.username}
              >
                {isLoading ? "Adding..." : "Add Account"}
              </Button>
            </div>
          </form>
        )}
        
        {accounts.length === 0 && !showAddForm ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>You haven't linked any social media accounts yet.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowAddForm(true)}
            >
              Connect an Account
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account, index) => (
              <div key={account.id || index}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {getPlatformName(account.platform)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{account.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={account.isPublic}
                      onCheckedChange={() => toggleVisibility(account.id, account.isPublic)}
                      aria-label={`${account.isPublic ? 'Hide' : 'Show'} ${getPlatformName(account.platform)} account`}
                    />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAccount(account.id)}
                      aria-label={`Remove ${getPlatformName(account.platform)} account`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {index < accounts.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>Toggle switches control which accounts are visible to other users.</p>
      </CardFooter>
    </Card>
  );
}