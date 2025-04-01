import { MemStorage } from "./storage";
import {
  Vendor, 
  InsertVendor,
  Restaurant, 
  InsertRestaurant,
  RestaurantReservation, 
  InsertRestaurantReservation,
  DiscountCode, 
  InsertDiscountCode,
  UserDiscountUsage, 
  InsertUserDiscountUsage
} from "@shared/schema-extension";

// Extend the MemStorage class with vendor functionality
export function extendMemStorageWithVendorSupport(memStorage: MemStorage) {
  // Add vendor data structures
  const vendors = new Map<number, Vendor>();
  const restaurants = new Map<number, Restaurant>();
  const restaurantReservations = new Map<number, RestaurantReservation>();
  const discountCodes = new Map<number, DiscountCode>();
  const userDiscountUsage = new Map<number, UserDiscountUsage>();
  
  // Add counters
  let vendorIdCounter = 1;
  let discountCodeIdCounter = 1;
  let userDiscountUsageIdCounter = 1;
  
  // Vendor operations
  memStorage.getVendor = async (id: number): Promise<Vendor | undefined> => {
    return vendors.get(id);
  };

  memStorage.getVendorByEmail = async (email: string): Promise<Vendor | undefined> => {
    return Array.from(vendors.values()).find(vendor => vendor.email === email);
  };

  memStorage.getVendorsByBusinessType = async (businessType: string): Promise<Vendor[]> => {
    return Array.from(vendors.values()).filter(
      vendor => vendor.businessType === businessType
    );
  };

  memStorage.getVendorByBusinessTypeAndId = async (businessType: string, businessId: number): Promise<Vendor | undefined> => {
    return Array.from(vendors.values()).find(
      vendor => vendor.businessType === businessType && vendor.businessId === businessId
    );
  };

  memStorage.createVendor = async (vendor: InsertVendor): Promise<Vendor> => {
    const id = vendorIdCounter++;
    const now = new Date();
    
    const newVendor: Vendor = {
      ...vendor,
      id,
      verified: vendor.verified || false,
      active: vendor.active || true,
      createdAt: now.toISOString(),
      lastLogin: undefined,
    };
    
    vendors.set(id, newVendor);
    return newVendor;
  };

  memStorage.updateVendor = async (id: number, vendorData: Partial<Vendor>): Promise<Vendor> => {
    const vendor = await memStorage.getVendor(id);
    if (!vendor) {
      throw new Error(`Vendor with id ${id} not found`);
    }
    
    const updatedVendor = { ...vendor, ...vendorData };
    vendors.set(id, updatedVendor);
    
    return updatedVendor;
  };

  memStorage.updateVendorLastLogin = async (id: number): Promise<Vendor> => {
    const vendor = await memStorage.getVendor(id);
    if (!vendor) {
      throw new Error(`Vendor with id ${id} not found`);
    }
    
    const updatedVendor = { 
      ...vendor, 
      lastLogin: new Date().toISOString() 
    };
    
    vendors.set(id, updatedVendor);
    return updatedVendor;
  };

  memStorage.verifyVendor = async (id: number): Promise<Vendor> => {
    const vendor = await memStorage.getVendor(id);
    if (!vendor) {
      throw new Error(`Vendor with id ${id} not found`);
    }
    
    const updatedVendor = { ...vendor, verified: true };
    vendors.set(id, updatedVendor);
    
    return updatedVendor;
  };

  memStorage.deactivateVendor = async (id: number): Promise<Vendor> => {
    const vendor = await memStorage.getVendor(id);
    if (!vendor) {
      throw new Error(`Vendor with id ${id} not found`);
    }
    
    const updatedVendor = { ...vendor, active: false };
    vendors.set(id, updatedVendor);
    
    return updatedVendor;
  };

  memStorage.authenticateVendor = async (email: string, password: string): Promise<Vendor | null> => {
    const vendor = await memStorage.getVendorByEmail(email);
    if (!vendor || vendor.password !== password || !vendor.active) {
      return null;
    }
    
    // Update last login time
    await memStorage.updateVendorLastLogin(vendor.id);
    
    return vendor;
  };

  // Restaurant operations
  memStorage.getRestaurant = async (id: number): Promise<Restaurant | undefined> => {
    return restaurants.get(id);
  };
  
  memStorage.createRestaurant = async (restaurant: InsertRestaurant): Promise<Restaurant> => {
    const id = memStorage.restaurantIdCounter ? memStorage.restaurantIdCounter++ : 1;
    
    if (!memStorage.restaurantIdCounter) {
      memStorage.restaurantIdCounter = 2;
    }
    
    const now = new Date();
    
    const newRestaurant: Restaurant = {
      ...restaurant,
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    
    restaurants.set(id, newRestaurant);
    return newRestaurant;
  };
  
  memStorage.updateRestaurant = async (id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant> => {
    const restaurant = await memStorage.getRestaurant(id);
    if (!restaurant) {
      throw new Error(`Restaurant with id ${id} not found`);
    }
    
    const updatedRestaurant = { 
      ...restaurant, 
      ...restaurantData,
      updatedAt: new Date().toISOString(),
    };
    
    restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  };
  
  // Discount code operations
  memStorage.getDiscountCode = async (id: number): Promise<DiscountCode | undefined> => {
    return discountCodes.get(id);
  };
  
  memStorage.getDiscountCodeByCode = async (code: string): Promise<DiscountCode | undefined> => {
    return Array.from(discountCodes.values()).find(
      discountCode => discountCode.code === code
    );
  };
  
  memStorage.getBusinessDiscountCodes = async (businessId: number): Promise<DiscountCode[]> => {
    return Array.from(discountCodes.values()).filter(
      discountCode => discountCode.vendorId === businessId
    );
  };
  
  memStorage.getActiveDiscountCodesByVendor = async (vendorId: number): Promise<DiscountCode[]> => {
    return Array.from(discountCodes.values()).filter(
      discountCode => discountCode.vendorId === vendorId && discountCode.active
    );
  };
  
  memStorage.createDiscountCode = async (code: InsertDiscountCode): Promise<DiscountCode> => {
    const id = discountCodeIdCounter++;
    const now = new Date();
    
    const newDiscountCode: DiscountCode = {
      ...code,
      id,
      usageCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    
    discountCodes.set(id, newDiscountCode);
    return newDiscountCode;
  };
  
  memStorage.updateDiscountCode = async (id: number, discountCodeData: Partial<DiscountCode>): Promise<DiscountCode> => {
    const discountCode = await memStorage.getDiscountCode(id);
    if (!discountCode) {
      throw new Error(`Discount code with id ${id} not found`);
    }
    
    const updatedDiscountCode = { 
      ...discountCode, 
      ...discountCodeData,
      updatedAt: new Date().toISOString(),
    };
    
    discountCodes.set(id, updatedDiscountCode);
    return updatedDiscountCode;
  };
  
  memStorage.incrementDiscountCodeUsage = async (id: number): Promise<DiscountCode> => {
    const discountCode = await memStorage.getDiscountCode(id);
    if (!discountCode) {
      throw new Error(`Discount code with id ${id} not found`);
    }
    
    const updatedDiscountCode = { 
      ...discountCode, 
      usageCount: (discountCode.usageCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    
    discountCodes.set(id, updatedDiscountCode);
    return updatedDiscountCode;
  };
  
  memStorage.deactivateDiscountCode = async (id: number): Promise<DiscountCode> => {
    const discountCode = await memStorage.getDiscountCode(id);
    if (!discountCode) {
      throw new Error(`Discount code with id ${id} not found`);
    }
    
    const updatedDiscountCode = { 
      ...discountCode, 
      active: false,
      updatedAt: new Date().toISOString(),
    };
    
    discountCodes.set(id, updatedDiscountCode);
    return updatedDiscountCode;
  };
  
  memStorage.validateDiscountCode = async (code: string, purchaseAmount: number): Promise<{ 
    valid: boolean; 
    discountCode?: DiscountCode; 
    finalAmount?: number; 
    message?: string;
  }> => {
    const discountCode = await memStorage.getDiscountCodeByCode(code);
    
    if (!discountCode) {
      return { valid: false, message: 'Discount code not found' };
    }
    
    if (!discountCode.active) {
      return { valid: false, message: 'Discount code is inactive' };
    }
    
    const now = new Date();
    
    // Check if code has expired
    if (discountCode.endDate && new Date(discountCode.endDate) < now) {
      return { valid: false, message: 'Discount code has expired' };
    }
    
    // Check if start date has been reached
    if (discountCode.startDate && new Date(discountCode.startDate) > now) {
      return { valid: false, message: 'Discount code is not yet active' };
    }
    
    // Check if usage limit has been reached
    if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
      return { valid: false, message: 'Discount code usage limit reached' };
    }
    
    // Check minimum purchase amount
    if (discountCode.minPurchase && purchaseAmount < discountCode.minPurchase) {
      return { 
        valid: false, 
        message: `Minimum purchase amount of ${discountCode.minPurchase} required` 
      };
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (discountCode.discountType === 'percentage') {
      discountAmount = purchaseAmount * (discountCode.discountValue / 100);
      
      // Apply maximum discount if specified
      if (discountCode.maxDiscount && discountAmount > discountCode.maxDiscount) {
        discountAmount = discountCode.maxDiscount;
      }
    } else if (discountCode.discountType === 'fixed_amount') {
      discountAmount = discountCode.discountValue;
    }
    
    const finalAmount = Math.max(0, purchaseAmount - discountAmount);
    
    return {
      valid: true,
      discountCode,
      finalAmount,
    };
  };
  
  // User discount usage operations
  memStorage.getUserDiscountUsage = async (userId: number, discountCodeId: number): Promise<UserDiscountUsage | undefined> => {
    return Array.from(userDiscountUsage.values()).find(
      usage => usage.userId === userId && usage.discountCodeId === discountCodeId
    );
  };
  
  memStorage.incrementUserDiscountUsage = async (userId: number, discountCodeId: number): Promise<UserDiscountUsage> => {
    const usage = await memStorage.getUserDiscountUsage(userId, discountCodeId);
    
    if (usage) {
      // Update existing usage
      const updatedUsage = { 
        ...usage, 
        usageCount: usage.usageCount + 1,
        lastUsed: new Date().toISOString(),
      };
      
      userDiscountUsage.set(usage.id, updatedUsage);
      return updatedUsage;
    } else {
      // Create new usage record
      const id = userDiscountUsageIdCounter++;
      const now = new Date();
      
      const newUsage: UserDiscountUsage = {
        id,
        userId,
        discountCodeId,
        usageCount: 1,
        lastUsed: now.toISOString(),
      };
      
      userDiscountUsage.set(id, newUsage);
      return newUsage;
    }
  };
  
  // Restaurant stats
  memStorage.getRestaurantStats = async (restaurantId: number): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    canceled: number;
    completed: number;
    todayReservations: number;
    upcomingReservations: number;
  }> => {
    const allReservations = Array.from(restaurantReservations.values())
      .filter(reservation => reservation.restaurantId === restaurantId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayReservations = allReservations.filter(reservation => {
      const reservationDate = new Date(reservation.reservationDate);
      return reservationDate >= today && reservationDate < tomorrow;
    });
    
    const upcomingReservations = allReservations.filter(reservation => {
      const reservationDate = new Date(reservation.reservationDate);
      return reservationDate >= today;
    });
    
    return {
      total: allReservations.length,
      pending: allReservations.filter(r => r.status === 'pending').length,
      confirmed: allReservations.filter(r => r.status === 'confirmed').length,
      canceled: allReservations.filter(r => r.status === 'canceled').length,
      completed: allReservations.filter(r => r.status === 'completed').length,
      todayReservations: todayReservations.length,
      upcomingReservations: upcomingReservations.length,
    };
  };
  
  memStorage.getRestaurantReservation = async (id: number): Promise<RestaurantReservation | undefined> => {
    return restaurantReservations.get(id);
  };
  
  memStorage.getRestaurantReservations = async (restaurantId: number, filters?: { 
    status?: string; 
    date?: string;
  }): Promise<RestaurantReservation[]> => {
    let reservations = Array.from(restaurantReservations.values())
      .filter(reservation => reservation.restaurantId === restaurantId);
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        reservations = reservations.filter(r => r.status === filters.status);
      }
      
      if (filters.date) {
        const filterDate = new Date(filters.date);
        filterDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        reservations = reservations.filter(r => {
          const reservationDate = new Date(r.reservationDate);
          return reservationDate >= filterDate && reservationDate < nextDay;
        });
      }
    }
    
    // Sort by reservation date
    return reservations.sort((a, b) => {
      const dateA = new Date(a.reservationDate);
      const dateB = new Date(b.reservationDate);
      return dateA.getTime() - dateB.getTime();
    });
  };
  
  memStorage.updateRestaurantReservation = async (id: number, reservationData: Partial<RestaurantReservation>): Promise<RestaurantReservation> => {
    const reservation = await memStorage.getRestaurantReservation(id);
    if (!reservation) {
      throw new Error(`Reservation with id ${id} not found`);
    }
    
    const updatedReservation = { 
      ...reservation, 
      ...reservationData,
      updatedAt: new Date().toISOString(),
    };
    
    restaurantReservations.set(id, updatedReservation);
    return updatedReservation;
  };
  
  // Analytics for vendors
  memStorage.getRestaurantReservationAnalytics = async (restaurantId: number, period: string): Promise<any> => {
    // This would typically query the database for analytics
    // For in-memory storage, we'll return a simple structure with sample data
    return {
      totalReservations: 45,
      reservationsOverTime: [
        { date: '2023-01-01', count: 3 },
        { date: '2023-01-02', count: 5 },
        { date: '2023-01-03', count: 2 },
        // ... more dates
      ],
      averagePartySize: 3.2,
      popularTimes: [
        { hour: 18, count: 12 },
        { hour: 19, count: 15 },
        { hour: 20, count: 10 },
        // ... more hours
      ],
    };
  };
  
  memStorage.getRestaurantRevenueAnalytics = async (restaurantId: number, period: string): Promise<any> => {
    // This would typically query the database for analytics
    // For in-memory storage, we'll return a simple structure with sample data
    return {
      totalRevenue: 12500,
      revenueByDay: [
        { date: '2023-01-01', revenue: 1200 },
        { date: '2023-01-02', revenue: 1500 },
        { date: '2023-01-03', revenue: 900 },
        // ... more dates
      ],
      averageOrderValue: 85.5,
      topSellingItems: [
        { itemId: 1, name: 'Pasta Carbonara', quantity: 42, revenue: 840 },
        { itemId: 2, name: 'Grilled Salmon', quantity: 38, revenue: 950 },
        { itemId: 3, name: 'Tiramisu', quantity: 35, revenue: 350 },
        // ... more items
      ],
    };
  };
  
  return memStorage;
}