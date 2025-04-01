import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../config";
import Toast from "react-native-toast-message";

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

  // Check if the vendor is already logged in on component mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const vendorToken = await AsyncStorage.getItem('vendorToken');
        
        if (vendorToken) {
          setIsLoading(true);
          
          const response = await axios.get(`${API_URL}/api/vendor/profile`, {
            headers: {
              Authorization: `Bearer ${vendorToken}`
            }
          });
          
          setVendor(response.data);
        }
      } catch (err) {
        // If the token is invalid, clear it
        await AsyncStorage.removeItem('vendorToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkToken();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/vendor/login`, {
        email,
        password
      });
      
      const data = response.data;
      setVendor(data.vendor);
      
      // Save the token to AsyncStorage
      await AsyncStorage.setItem('vendorToken', data.token);
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'An unexpected error occurred',
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
      await AsyncStorage.removeItem('vendorToken');
      setVendor(null);
      
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out',
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: error.message || 'An unexpected error occurred',
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
      const vendorToken = await AsyncStorage.getItem('vendorToken');
      
      if (!vendorToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.patch(`${API_URL}/api/vendor/profile`, data, {
        headers: {
          Authorization: `Bearer ${vendorToken}`
        }
      });
      
      const updatedVendor = response.data;
      setVendor(updatedVendor);
      
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been successfully updated',
      });
      
      return updatedVendor;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'An unexpected error occurred',
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