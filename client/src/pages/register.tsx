import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SocialButtons } from "@/components/auth/social-buttons";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OtpInput } from "@/components/auth/otp-input";

export default function Register() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState<"details" | "verification">("details");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [registrationMethod, setRegistrationMethod] = useState<"email" | "phone">("email");

  // Extended schema with password confirmation and phone
  const registerSchema = insertUserSchema
    .extend({
      confirmPassword: z.string(),
      phone: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

  // Phone registration schema
  const phoneRegisterSchema = z.object({
    phone: z.string().min(10, "Valid phone number is required"),
    displayName: z.string().min(2, "Display name is required"),
  });

  // Setup form
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      bio: "",
      interests: [],
      avatar: "",
      phone: "",
    },
  });

  // Phone registration form
  const phoneForm = useForm<z.infer<typeof phoneRegisterSchema>>({
    resolver: zodResolver(phoneRegisterSchema),
    defaultValues: {
      phone: "",
      displayName: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", data);
      const result = await response.json();
      
      toast({
        title: "Registration Successful",
        description: "Please log in with your new account",
      });
      
      navigate('/login');
    } catch (error) {
      let message = "Failed to register";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Registration Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone registration
  const onPhoneSubmit = async (data: z.infer<typeof phoneRegisterSchema>) => {
    setIsLoading(true);
    try {
      setPhoneNumber(data.phone);
      
      const response = await apiRequest("POST", "/api/auth/request-register-otp", {
        phone: data.phone,
        displayName: data.displayName,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsOtpSent(true);
        toast({
          title: "Verification Code Sent",
          description: "Please enter the code sent to your phone",
        });
      } else {
        throw new Error(result.message || "Failed to send verification code");
      }
    } catch (error) {
      let message = "Failed to send verification code";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Registration Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification for registration
  const handleVerifyRegistrationOtp = async () => {
    if (otpValue.length !== 6) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-register-otp", {
        phone: phoneNumber,
        otp: otpValue,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created successfully",
        });
        
        navigate('/login');
      } else {
        throw new Error(result.message || "Invalid verification code");
      }
    } catch (error) {
      let message = "Verification failed";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Verification Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/request-register-otp", {
        phone: phoneNumber,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOtpValue("");
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your phone",
        });
      } else {
        throw new Error(result.message || "Failed to resend code");
      }
    } catch (error) {
      let message = "Failed to resend code";
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: "Resend Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLoginSuccess = () => {
    toast({
      title: "Registration Successful",
      description: "You've been successfully registered",
    });
    navigate('/nearby');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            <span className="text-primary">Tralla</span>
          </CardTitle>
          <CardDescription className="text-center">
            Create an account to connect with people nearby
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Social registration buttons */}
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
                Or register with
              </span>
            </div>
          </div>

          {/* Registration tabs */}
          <Tabs defaultValue="email" className="w-full mt-6" onValueChange={(value) => {
            setRegistrationMethod(value as "email" | "phone");
            setIsOtpSent(false);
            setOtpValue("");
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            
            {/* Email registration tab content */}
            <TabsContent value="email" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Password must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us a bit about yourself" 
                            className="resize-none"
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            value={field.value || ""}
                            ref={field.ref}
                            name={field.name}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Phone registration tab content */}
            <TabsContent value="phone" className="mt-4">
              {!isOtpSent ? (
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                    <FormField
                      control={phoneForm.control}
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
                    
                    <FormField
                      control={phoneForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send Verification Code"}
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
                      onComplete={handleVerifyRegistrationOtp}
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
                      className="w-full" 
                      onClick={handleVerifyRegistrationOtp} 
                      disabled={otpValue.length !== 6 || isLoading}
                    >
                      {isLoading ? "Verifying..." : "Verify & Register"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" onClick={() => navigate('/login')}>
            Already have an account? Log in
          </Button>
          
          <div className="text-xs text-center text-neutral-500 mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
