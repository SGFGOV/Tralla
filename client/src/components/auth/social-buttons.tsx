import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SocialButtonsProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function SocialButtons({ onSuccess, onError, className }: SocialButtonsProps) {
  const { toast } = useToast();

  const handleSocialLogin = async (provider: string) => {
    try {
      const response = await apiRequest("POST", `/api/auth/oauth/${provider}`, {});
      const data = await response.json();
      
      if (data.redirectUrl) {
        // Redirect to OAuth provider
        window.location.href = data.redirectUrl;
      } else if (data.success) {
        toast({
          title: "Login Successful",
          description: `You have successfully logged in with ${provider}`,
        });
        onSuccess?.();
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Failed to login with social provider",
        variant: "destructive",
      });
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    }
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <Button 
        variant="outline" 
        className="flex items-center justify-center gap-2"
        onClick={() => handleSocialLogin('google')}
      >
        <FaGoogle className="text-red-500" />
        <span>Continue with Google</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-center gap-2"
        onClick={() => handleSocialLogin('facebook')}
      >
        <FaFacebook className="text-blue-600" />
        <span>Continue with Facebook</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-center gap-2"
        onClick={() => handleSocialLogin('twitter')}
      >
        <FaTwitter className="text-blue-400" />
        <span>Continue with Twitter</span>
      </Button>
    </div>
  );
}