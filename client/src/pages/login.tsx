import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialButtons } from "@/components/auth/social-buttons";
import { OtpInput } from "@/components/auth/otp-input";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

// Password login form schema
const passwordLoginSchema = z.object({
  username: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

// OTP form schema
const otpRequestSchema = z.object({
  phone: z.string().min(10, "Valid phone number is required"),
});

export default function Login() {
  const [_, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Password login form
  const passwordForm = useForm<z.infer<typeof passwordLoginSchema>>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // OTP request form
  const otpForm = useForm<z.infer<typeof otpRequestSchema>>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      phone: "",
    },
  });

  // Handle password form submission
  const onPasswordSubmit = async (data: z.infer<typeof passwordLoginSchema>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const userData = await response.json();
      
      login(userData);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.displayName || userData.username}!`,
      });
      
      navigate('/nearby');
    } catch (error) {
      let message = "Failed to login";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Login Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP request form submission
  const onOtpRequestSubmit = async (data: z.infer<typeof otpRequestSchema>) => {
    setIsLoading(true);
    try {
      // Store phone number for verification
      setPhoneNumber(data.phone);
      
      const response = await apiRequest("POST", "/api/auth/request-otp", { phone: data.phone });
      const result = await response.json();
      
      if (result.success) {
        setIsOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "A verification code has been sent to your phone",
        });
      } else {
        throw new Error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      let message = "Failed to send verification code";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "OTP Request Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        phone: phoneNumber,
        otp: otpValue
      });
      
      const userData = await response.json();
      
      login(userData);
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${userData.displayName || userData.username}!`,
      });
      
      navigate('/nearby');
    } catch (error) {
      let message = "Invalid verification code";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset OTP flow
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/request-otp", { phone: phoneNumber });
      const result = await response.json();
      
      if (result.success) {
        setOtpValue("");
        toast({
          title: "OTP Resent",
          description: "A new verification code has been sent to your phone",
        });
      } else {
        throw new Error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      let message = "Failed to resend verification code";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "OTP Request Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLoginSuccess = () => {
    toast({
      title: "Login Successful",
      description: "You've been successfully logged in",
    });
    navigate('/nearby');
  };

  const handleResetPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-600 to-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Tralla</span>
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to connect with people nearby
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social login buttons */}
          <SocialButtons 
            onSuccess={handleSocialLoginSuccess} 
            className="mb-4"
          />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          {/* Login tabs */}
          <Tabs defaultValue="password" className="w-full mt-6" onValueChange={(value) => {
            setLoginMethod(value as "password" | "otp");
            setIsOtpSent(false);
            setOtpValue("");
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>
            
            {/* Password login tab content */}
            <TabsContent value="password" className="mt-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com or +91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm"
                    onClick={handleResetPassword}
                  >
                    Forgot your password?
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* OTP login tab content */}
            <TabsContent value="otp" className="mt-4">
              {!isOtpSent ? (
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpRequestSubmit)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      We've sent a verification code to {phoneNumber}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-4">
                    <OtpInput
                      length={6}
                      value={otpValue}
                      onChange={setOtpValue}
                      onComplete={handleVerifyOtp}
                      disabled={isLoading}
                      className="justify-center"
                    />
                    
                    <div className="flex justify-between w-full mt-4">
                      <Button
                        type="button"
                        variant="link"
                        className="px-0"
                        onClick={() => setIsOtpSent(false)}
                        disabled={isLoading}
                      >
                        Change Number
                      </Button>
                      
                      <Button
                        type="button"
                        variant="link"
                        className="px-0"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                      >
                        Resend Code
                      </Button>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
                      onClick={handleVerifyOtp} 
                      disabled={otpValue.length !== 6 || isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify & Login"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" onClick={() => navigate('/register')}>
            Don't have an account? Register
          </Button>
          
          <div className="text-xs text-center text-neutral-500 mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
