import { Request, Response, NextFunction, Express } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IStorage } from './storage';

// JWT Secret - should be moved to environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'vendor-jwt-secret-key';

// Set up file upload for vendor logos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'vendor-logos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `vendor-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any);
    }
  }
});

// Define schemas
const vendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const vendorRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  businessType: z.enum(['restaurant', 'movie_theater', 'activity_provider']),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

const restaurantSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  cuisine: z.string().min(2),
  priceRange: z.string(),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  featuredImage: z.string().optional(),
});

const updateRestaurantSchema = restaurantSchema.partial();

const tableSchema = z.object({
  number: z.string(),
  capacity: z.number().int().positive(),
  section: z.string().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).default('available'),
});

const updateTableSchema = tableSchema.partial();

const discountCodeSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  maxUses: z.number().int().optional(),
  expiresAt: z.string().optional(),
  minSpend: z.number().optional(),
  active: z.boolean().default(true),
  businessId: z.number().int(),
});

const updateDiscountCodeSchema = discountCodeSchema.partial();

// Middleware to verify vendor JWT
const verifyVendorToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { vendorId: number };
    req.vendorId = decoded.vendorId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Error handling middleware
const handleErrors = (err: any, res: Response) => {
  if (err instanceof z.ZodError) {
    const validationError = fromZodError(err);
    return res.status(400).json({ error: validationError.message });
  }
  
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
};

// Register vendor routes
export function registerVendorRoutes(app: Express, storage: IStorage) {
  // Vendor authentication routes
  app.post('/api/vendor/register', async (req: Request, res: Response) => {
    try {
      const data = vendorRegisterSchema.parse(req.body);
      
      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      
      // Check if email exists
      const existingVendor = await storage.getVendorByEmail(data.email);
      if (existingVendor) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // Create the vendor
      const vendor = await storage.createVendor({
        name: data.name,
        email: data.email,
        password: data.password, // In production, this should be hashed
        businessType: data.businessType,
        verified: false, // Vendors need to be verified by admin
        active: true,
        createdAt: new Date().toISOString(),
      });
      
      // Generate JWT
      const token = jwt.sign(
        { vendorId: vendor.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return vendor without password
      const { password, ...vendorWithoutPassword } = vendor;
      res.status(201).json({
        vendor: vendorWithoutPassword,
        token,
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/vendor/login', async (req: Request, res: Response) => {
    try {
      const data = vendorLoginSchema.parse(req.body);
      
      // Find vendor by email
      const vendor = await storage.getVendorByEmail(data.email);
      
      // Check if vendor exists and password matches
      if (!vendor || vendor.password !== data.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Check if vendor is active
      if (!vendor.active) {
        return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
      }
      
      // Update last login
      await storage.updateVendor(vendor.id, {
        lastLogin: new Date().toISOString(),
      });
      
      // Generate JWT
      const token = jwt.sign(
        { vendorId: vendor.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Return vendor without password
      const { password, ...vendorWithoutPassword } = vendor;
      res.json({
        vendor: vendorWithoutPassword,
        token,
      });
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Vendor profile routes
  app.get('/api/vendor/profile', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Return vendor without password
      const { password, ...vendorWithoutPassword } = vendor;
      res.json(vendorWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/vendor/profile', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const updateData = req.body;
      
      // Don't allow updating critical fields
      delete updateData.id;
      delete updateData.password;
      delete updateData.email;
      delete updateData.verified;
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      const updatedVendor = await storage.updateVendor(vendorId, updateData);
      
      // Return vendor without password
      const { password, ...vendorWithoutPassword } = updatedVendor;
      res.json(vendorWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/vendor/profile/logo', verifyVendorToken, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // If vendor already has a logo, delete the old one
      if (vendor.logo) {
        const oldLogoPath = path.join(process.cwd(), vendor.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      // Update the vendor record with the new logo path
      const logoPath = `/uploads/vendor-logos/${file.filename}`;
      const updatedVendor = await storage.updateVendor(vendorId, {
        logo: logoPath,
      });
      
      // Return vendor without password
      const { password, ...vendorWithoutPassword } = updatedVendor;
      res.json(vendorWithoutPassword);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Restaurant management routes
  app.post('/api/vendor/restaurants', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const data = restaurantSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (vendor.businessType !== 'restaurant') {
        return res.status(403).json({ error: 'Vendor is not a restaurant' });
      }
      
      // Check if vendor already has a restaurant
      if (vendor.businessId) {
        return res.status(400).json({ error: 'Vendor already has a restaurant registered' });
      }
      
      // Create restaurant
      const restaurant = await storage.createRestaurant({
        ...data,
        vendorId,
        active: true,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      });
      
      // Update vendor with restaurant ID
      await storage.updateVendor(vendorId, {
        businessId: restaurant.id,
      });
      
      res.status(201).json(restaurant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/vendor/restaurants', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      if (vendor.businessType !== 'restaurant') {
        return res.status(403).json({ error: 'Vendor is not a restaurant' });
      }
      
      // If vendor has a restaurant ID, fetch it
      if (vendor.businessId) {
        const restaurant = await storage.getRestaurant(vendor.businessId);
        if (restaurant) {
          return res.json([restaurant]);
        }
      }
      
      // If no restaurant found, return empty array
      res.json([]);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/vendor/restaurants/:id', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view this restaurant' });
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      res.json(restaurant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/vendor/restaurants/:id', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      const updateData = updateRestaurantSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to update this restaurant' });
      }
      
      const updatedRestaurant = await storage.updateRestaurant(restaurantId, updateData);
      
      res.json(updatedRestaurant);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Restaurant statistics
  app.get('/api/vendor/restaurants/:id/stats', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view this restaurant stats' });
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      // Get reservation statistics
      const stats = await storage.getRestaurantStats(restaurantId);
      
      res.json(stats);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Restaurant reservation management
  app.get('/api/vendor/restaurants/:id/reservations', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      const status = req.query.status as string | undefined;
      const date = req.query.date as string | undefined;
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view these reservations' });
      }
      
      // Get reservations with optional filters
      const reservations = await storage.getRestaurantReservations(restaurantId, { status, date });
      
      res.json(reservations);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/vendor/restaurants/:restaurantId/reservations/:reservationId', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.restaurantId);
      const reservationId = Number(req.params.reservationId);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view this reservation' });
      }
      
      // Get reservation details
      const reservation = await storage.getRestaurantReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      // Check if reservation belongs to this restaurant
      if (reservation.restaurantId !== restaurantId) {
        return res.status(403).json({ error: 'Reservation does not belong to this restaurant' });
      }
      
      res.json(reservation);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/vendor/restaurants/:restaurantId/reservations/:reservationId', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.restaurantId);
      const reservationId = Number(req.params.reservationId);
      const updateData = req.body;
      
      // Validate allowed fields for update
      const allowedFields = ['status', 'tableNumber', 'notes'];
      const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
      }
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to update this reservation' });
      }
      
      // Get reservation to check ownership
      const reservation = await storage.getRestaurantReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      // Check if reservation belongs to this restaurant
      if (reservation.restaurantId !== restaurantId) {
        return res.status(403).json({ error: 'Reservation does not belong to this restaurant' });
      }
      
      // Update reservation
      const updatedReservation = await storage.updateRestaurantReservation(reservationId, updateData);
      
      res.json(updatedReservation);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Restaurant tables management
  app.get('/api/vendor/restaurants/:id/tables', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view these tables' });
      }
      
      // Get tables
      const tables = await storage.getRestaurantTables(restaurantId);
      
      res.json(tables);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/vendor/restaurants/:id/tables', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      const tableData = tableSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to add tables to this restaurant' });
      }
      
      // Check if table number already exists
      const existingTables = await storage.getRestaurantTables(restaurantId);
      const tableExists = existingTables.some(table => table.number === tableData.number);
      
      if (tableExists) {
        return res.status(400).json({ error: 'Table number already exists' });
      }
      
      // Create table
      const table = await storage.createRestaurantTable({
        ...tableData,
        restaurantId,
      });
      
      res.status(201).json(table);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/vendor/restaurants/:restaurantId/tables/:tableId', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.restaurantId);
      const tableId = Number(req.params.tableId);
      const updateData = updateTableSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to update tables in this restaurant' });
      }
      
      // Get table to check ownership
      const table = await storage.getRestaurantTable(tableId);
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      // Check if table belongs to this restaurant
      if (table.restaurantId !== restaurantId) {
        return res.status(403).json({ error: 'Table does not belong to this restaurant' });
      }
      
      // If updating table number, check if the new number already exists
      if (updateData.number && updateData.number !== table.number) {
        const existingTables = await storage.getRestaurantTables(restaurantId);
        const tableExists = existingTables.some(t => t.number === updateData.number && t.id !== tableId);
        
        if (tableExists) {
          return res.status(400).json({ error: 'Table number already exists' });
        }
      }
      
      // Update table
      const updatedTable = await storage.updateRestaurantTable(tableId, updateData);
      
      res.json(updatedTable);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete('/api/vendor/restaurants/:restaurantId/tables/:tableId', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.restaurantId);
      const tableId = Number(req.params.tableId);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to delete tables from this restaurant' });
      }
      
      // Get table to check ownership
      const table = await storage.getRestaurantTable(tableId);
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      // Check if table belongs to this restaurant
      if (table.restaurantId !== restaurantId) {
        return res.status(403).json({ error: 'Table does not belong to this restaurant' });
      }
      
      // Delete table
      await storage.deleteRestaurantTable(tableId);
      
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Discount code management
  app.get('/api/vendor/discount-codes', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // If vendor has no business ID, return empty array
      if (!vendor.businessId) {
        return res.json([]);
      }
      
      // Get discount codes for this business
      const discountCodes = await storage.getBusinessDiscountCodes(vendor.businessId);
      
      res.json(discountCodes);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.post('/api/vendor/discount-codes', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const discountData = discountCodeSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if vendor has a business ID
      if (!vendor.businessId) {
        return res.status(400).json({ error: 'Vendor does not have a business registered' });
      }
      
      // Check if this business belongs to the vendor
      if (vendor.businessId !== discountData.businessId) {
        return res.status(403).json({ error: 'You do not have permission to create discount codes for this business' });
      }
      
      // Check if code already exists
      const existingCodes = await storage.getBusinessDiscountCodes(vendor.businessId);
      const codeExists = existingCodes.some(code => code.code === discountData.code);
      
      if (codeExists) {
        return res.status(400).json({ error: 'Discount code already exists' });
      }
      
      // Create discount code
      const discountCode = await storage.createDiscountCode({
        ...discountData,
        createdAt: new Date().toISOString(),
        usedCount: 0,
      });
      
      res.status(201).json(discountCode);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.patch('/api/vendor/discount-codes/:id', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const discountId = Number(req.params.id);
      const updateData = updateDiscountCodeSchema.parse(req.body);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Get discount code to check ownership
      const discountCode = await storage.getDiscountCode(discountId);
      if (!discountCode) {
        return res.status(404).json({ error: 'Discount code not found' });
      }
      
      // Check if this business belongs to the vendor
      if (vendor.businessId !== discountCode.businessId) {
        return res.status(403).json({ error: 'You do not have permission to update this discount code' });
      }
      
      // If updating code, check if the new code already exists
      if (updateData.code && updateData.code !== discountCode.code) {
        const existingCodes = await storage.getBusinessDiscountCodes(vendor.businessId!);
        const codeExists = existingCodes.some(code => code.code === updateData.code && code.id !== discountId);
        
        if (codeExists) {
          return res.status(400).json({ error: 'Discount code already exists' });
        }
      }
      
      // Update discount code
      const updatedDiscountCode = await storage.updateDiscountCode(discountId, updateData);
      
      res.json(updatedDiscountCode);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.delete('/api/vendor/discount-codes/:id', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const discountId = Number(req.params.id);
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Get discount code to check ownership
      const discountCode = await storage.getDiscountCode(discountId);
      if (!discountCode) {
        return res.status(404).json({ error: 'Discount code not found' });
      }
      
      // Check if this business belongs to the vendor
      if (vendor.businessId !== discountCode.businessId) {
        return res.status(403).json({ error: 'You do not have permission to delete this discount code' });
      }
      
      // Delete discount code
      await storage.deleteDiscountCode(discountId);
      
      res.status(204).send();
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Analytics endpoints
  app.get('/api/vendor/restaurants/:id/analytics/reservations', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      const period = req.query.period as string || 'week'; // 'day', 'week', 'month', 'year'
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view analytics for this restaurant' });
      }
      
      // Get reservation analytics
      const analytics = await storage.getRestaurantReservationAnalytics(restaurantId, period);
      
      res.json(analytics);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  app.get('/api/vendor/restaurants/:id/analytics/revenue', verifyVendorToken, async (req: Request, res: Response) => {
    try {
      const vendorId = req.vendorId;
      const restaurantId = Number(req.params.id);
      const period = req.query.period as string || 'week'; // 'day', 'week', 'month', 'year'
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      // Check if this restaurant belongs to the vendor
      if (vendor.businessId !== restaurantId) {
        return res.status(403).json({ error: 'You do not have permission to view analytics for this restaurant' });
      }
      
      // Get revenue analytics
      const analytics = await storage.getRestaurantRevenueAnalytics(restaurantId, period);
      
      res.json(analytics);
    } catch (err) {
      handleErrors(err, res);
    }
  });
  
  // Add restaurant menu management and other endpoints as needed
};

// Extend Express Request interface to include vendorId
declare global {
  namespace Express {
    interface Request {
      vendorId?: number;
    }
  }
}