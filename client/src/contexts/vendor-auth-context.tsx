import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Vendor type definition
interface Vendor {
  id: number;
  name: string;
  email: string;
  businessType: string;
  businessId?: number;
  logo?: string;
  verified: boolean;
  active: boolean;
  stripeAccountId?: string;
  createdAt: string;
  lastLogin?: string;
}

// Auth context type
interface VendorAuthContextType {
  vendor: Vendor | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<{ vendor: Vendor; token: string }>;
  logout: () => Promise<void>;
  updateVendor: (data: Partial<Vendor>) => Promise<Vendor>;
}

// Create the context
export const VendorAuthContext = createContext<VendorAuthContextType | null>(null);

// Auth provider component
export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Check if the vendor is already logged in on component mount
  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    
    if (vendorToken) {
      setIsLoading(true);
      
      apiRequest('GET', '/api/vendor/profile', undefined, {
        headers: {
          Authorization: `Bearer ${vendorToken}`
        }
      })
      .then(async (res) => {
        if (res.ok) {
          const vendorData = await res.json();
          setVendor(vendorData);
        } else {
          // If the token is invalid, clear it
          localStorage.removeItem('vendorToken');
        }
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest('POST', '/api/vendor/login', { email, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await res.json();
      setVendor(data.vendor);
      
      // Save the token to localStorage
      localStorage.setItem('vendorToken', data.token);
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // We don't need to call a logout endpoint since we're using JWT
      // Just remove the token and clear the vendor state
      localStorage.removeItem('vendorToken');
      setVendor(null);
      
      // Clear the React Query cache
      queryClient.clear();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update vendor function
  const updateVendor = async (data: Partial<Vendor>): Promise<Vendor> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const vendorToken = localStorage.getItem('vendorToken');
      
      if (!vendorToken) {
        throw new Error('Not authenticated');
      }
      
      const res = await apiRequest('PATCH', '/api/vendor/profile', data, {
        headers: {
          Authorization: `Bearer ${vendorToken}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Update failed');
      }
      
      const updatedVendor = await res.json();
      setVendor(updatedVendor);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      
      return updatedVendor;
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VendorAuthContext.Provider
      value={{
        vendor,
        isLoading,
        error,
        login,
        logout,
        updateVendor,
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
}

// Custom hook to use the vendor auth context
export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }
  return context;
}