import { useState } from "react";
import { useLocation } from "wouter";
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
import { OtpInput } from "@/components/auth/otp-input";
import { apiRequest } from "@/lib/queryClient";

// Email form schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Reset password schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otpValue, setOtpValue] = useState("");

  // Email form
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Reset password form
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Handle email form submission to request reset code
  const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      setEmail(data.email);
      
      const response = await apiRequest("POST", "/api/auth/request-password-reset", { email: data.email });
      const result = await response.json();
      
      if (result.success) {
        setStep("otp");
        toast({
          title: "Reset Code Sent",
          description: "A password reset code has been sent to your email",
        });
      } else {
        throw new Error(result.message || "Failed to send reset code");
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to send reset code",
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
      const response = await apiRequest("POST", "/api/auth/verify-reset-token", {
        email: email,
        token: otpValue
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResetToken(otpValue);
        setStep("reset");
        toast({
          title: "Code Verified",
          description: "You can now reset your password",
        });
      } else {
        throw new Error(result.message || "Invalid verification code");
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const onResetSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email: email,
        token: resetToken,
        password: data.password,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset successfully",
        });
        navigate('/login');
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend reset code
  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/request-password-reset", { email });
      const result = await response.json();
      
      if (result.success) {
        setOtpValue("");
        toast({
          title: "Reset Code Resent",
          description: "A new password reset code has been sent to your email",
        });
      } else {
        throw new Error(result.message || "Failed to resend reset code");
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Failed to resend reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            <span className="text-primary">Reset Password</span>
          </CardTitle>
          <CardDescription className="text-center">
            {step === "email" && "Enter your email to receive a password reset code"}
            {step === "otp" && "Enter the verification code sent to your email"}
            {step === "reset" && "Create a new password for your account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === "email" && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            </Form>
          )}
          
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to {email}
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
                    onClick={() => setStep("email")}
                    disabled={isLoading}
                  >
                    Change Email
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    className="px-0"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend Code
                  </Button>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleVerifyOtp} 
                  disabled={otpValue.length !== 6 || isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </div>
            </div>
          )}
          
          {step === "reset" && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}