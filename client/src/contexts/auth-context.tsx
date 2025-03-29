import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@shared/schema';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isAuthenticated: false,
});

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Check for existing user in localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
  }, []);
  
  // Login function - store user data in state and localStorage
  const login = (userData: User) => {
    // Remove password before storing user data
    const { password, ...userWithoutPassword } = userData;
    setUser(userWithoutPassword as User);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
  };
  
  // Logout function - clear user data from state and localStorage
  const logout = async () => {
    if (user) {
      try {
        // Call logout API to update server-side status
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    // Clear user from state and storage
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };
  
  // Update user data
  const updateUser = (userData: User) => {
    // Remove password before storing user data
    const { password, ...userWithoutPassword } = userData;
    setUser(userWithoutPassword as User);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
  };
  
  // Computed property for authenticated status
  const isAuthenticated = user !== null;
  
  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);
