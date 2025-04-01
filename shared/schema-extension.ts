import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Language } from "./i18n";
import { users, groups, trips, groupTickets } from "./schema";

// Vendors table for business providers (restaurants, movie theaters, etc.)
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  businessType: text("business_type").notNull(), // restaurant, movie_theater, etc.
  businessId: integer("business_id"), // ID of the specific business entity (restaurantId, theaterId, etc.)
  logo: text("logo"),
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  stripeAccountId: text("stripe_account_id"), // For payouts
  settings: jsonb("settings").$type<Record<string, any>>(), // Vendor-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertVendorSchema = createInsertSchema(vendors).pick({
  name: true,
  email: true,
  password: true,
  phone: true,
  businessType: true,
  businessId: true,
  logo: true,
  stripeAccountId: true,
  settings: true,
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Discount codes for promotions
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  code: text("code").notNull().unique(),
  description: text("description").default(""),
  discountType: text("discount_type").notNull(), // percentage, fixed_amount
  discountValue: doublePrecision("discount_value").notNull(), // Percentage or amount
  minPurchase: doublePrecision("min_purchase").default(0),
  maxDiscount: doublePrecision("max_discount"), // Maximum discount amount for percentage discounts
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  usageLimit: integer("usage_limit"), // Total number of times code can be used
  usageCount: integer("usage_count").default(0),
  perUserLimit: integer("per_user_limit"), // Number of times each user can use the code
  active: boolean("active").default(true),
  applicableItems: jsonb("applicable_items").$type<{
    type: string; // all, specific
    itemIds?: number[]; // IDs of specific items if type is 'specific'
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).pick({
  vendorId: true,
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minPurchase: true,
  maxDiscount: true,
  startDate: true,
  endDate: true,
  usageLimit: true,
  perUserLimit: true,
  active: true,
  applicableItems: true,
});

export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;

// User discount code usage tracking
export const userDiscountUsage = pgTable("user_discount_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  discountCodeId: integer("discount_code_id").notNull().references(() => discountCodes.id),
  usageCount: integer("usage_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
});

export const insertUserDiscountUsageSchema = createInsertSchema(userDiscountUsage).pick({
  userId: true,
  discountCodeId: true,
  usageCount: true,
});

export type InsertUserDiscountUsage = z.infer<typeof insertUserDiscountUsageSchema>;
export type UserDiscountUsage = typeof userDiscountUsage.$inferSelect;

// Restaurants table to store restaurant information
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  location: text("location").notNull(),
  cuisine: text("cuisine").default(""),
  priceRange: text("price_range").default("$$"), // $, $$, $$$, $$$$
  rating: doublePrecision("rating"),
  imageUrl: text("image_url"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  openingHours: jsonb("opening_hours").$type<Record<string, string>>(), // {"monday": "9:00-22:00", "tuesday": "9:00-22:00", etc}
  hasReservations: boolean("has_reservations").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).pick({
  name: true,
  description: true,
  location: true,
  cuisine: true,
  priceRange: true,
  rating: true,
  imageUrl: true,
  contactPhone: true,
  contactEmail: true,
  website: true,
  openingHours: true,
  hasReservations: true,
});

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

// Restaurant Reservations table for booking tables
export const restaurantReservations = pgTable("restaurant_reservations", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  groupId: integer("group_id").references(() => groups.id), // Optional, if this is a group activity
  tripId: integer("trip_id").references(() => trips.id), // Optional, if this is part of a trip
  userId: integer("user_id").notNull().references(() => users.id), // User who made the reservation
  reservationDate: timestamp("reservation_date").notNull(),
  partySize: integer("party_size").notNull(),
  status: text("status").default("pending"), // pending, confirmed, canceled, completed
  specialRequests: text("special_requests").default(""),
  tableNumber: text("table_number"), // Assigned table number if available
  confirmationCode: text("confirmation_code"), // Reservation confirmation code
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRestaurantReservationSchema = createInsertSchema(restaurantReservations).pick({
  restaurantId: true,
  groupId: true,
  tripId: true,
  userId: true,
  reservationDate: true,
  partySize: true,
  specialRequests: true,
});

export type InsertRestaurantReservation = z.infer<typeof insertRestaurantReservationSchema>;
export type RestaurantReservation = typeof restaurantReservations.$inferSelect;

// Restaurant Reservation Participants for group reservations
export const restaurantReservationParticipants = pgTable("restaurant_reservation_participants", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull().references(() => restaurantReservations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, confirmed, declined
  dietary: jsonb("dietary").$type<string[]>(), // Array of dietary restrictions
  menuPreferences: jsonb("menu_preferences").$type<Record<string, any>>(), // Pre-selected menu items
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRestaurantReservationParticipantSchema = createInsertSchema(restaurantReservationParticipants).pick({
  reservationId: true,
  userId: true,
  status: true,
  dietary: true,
  menuPreferences: true,
});

export type InsertRestaurantReservationParticipant = z.infer<typeof insertRestaurantReservationParticipantSchema>;
export type RestaurantReservationParticipant = typeof restaurantReservationParticipants.$inferSelect;

// Movie Theaters table to store theater information
export const movieTheaters = pgTable("movie_theaters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  amenities: jsonb("amenities").$type<string[]>(), // ["IMAX", "Dolby Atmos", "Recliner Seats", etc]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMovieTheaterSchema = createInsertSchema(movieTheaters).pick({
  name: true,
  location: true,
  description: true,
  imageUrl: true,
  contactPhone: true,
  contactEmail: true,
  website: true,
  amenities: true,
});

export type InsertMovieTheater = z.infer<typeof insertMovieTheaterSchema>;
export type MovieTheater = typeof movieTheaters.$inferSelect;

// Movies table to store movie information
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  duration: integer("duration").notNull(), // in minutes
  releaseDate: timestamp("release_date"),
  genre: jsonb("genre").$type<string[]>(),
  rating: text("rating"), // PG, PG-13, R, etc.
  director: text("director"),
  cast: jsonb("cast").$type<string[]>(),
  posterUrl: text("poster_url"),
  trailerUrl: text("trailer_url"),
  language: text("language").default("English"),
  subtitles: jsonb("subtitles").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMovieSchema = createInsertSchema(movies).pick({
  title: true,
  description: true,
  duration: true,
  releaseDate: true,
  genre: true,
  rating: true,
  director: true,
  cast: true,
  posterUrl: true,
  trailerUrl: true,
  language: true,
  subtitles: true,
});

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

// Movie Showings table for specific movie showtimes
export const movieShowings = pgTable("movie_showings", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull().references(() => movies.id),
  theaterId: integer("theater_id").notNull().references(() => movieTheaters.id),
  showtime: timestamp("showtime").notNull(),
  endTime: timestamp("end_time").notNull(),
  screenNumber: text("screen_number").notNull(),
  format: text("format").default("Standard"), // Standard, IMAX, 3D, Dolby, etc.
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  price: doublePrecision("price").notNull(),
  status: text("status").default("scheduled"), // scheduled, canceled, sold-out
  seatingChart: jsonb("seating_chart").$type<{
    rows: number;
    cols: number;
    unavailableSeats: string[]; // Array of seat IDs that are unavailable
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMovieShowingSchema = createInsertSchema(movieShowings).pick({
  movieId: true,
  theaterId: true,
  showtime: true,
  endTime: true,
  screenNumber: true,
  format: true,
  totalSeats: true,
  availableSeats: true,
  price: true,
  status: true,
  seatingChart: true,
});

export type InsertMovieShowing = z.infer<typeof insertMovieShowingSchema>;
export type MovieShowing = typeof movieShowings.$inferSelect;

// Movie Tickets table for movie bookings
export const movieTickets = pgTable("movie_tickets", {
  id: serial("id").primaryKey(),
  showingId: integer("showing_id").notNull().references(() => movieShowings.id),
  groupTicketId: integer("group_ticket_id").references(() => groupTickets.id), // Link to group tickets if part of a group booking
  userId: integer("user_id").notNull().references(() => users.id), // User who purchased the ticket
  groupId: integer("group_id").references(() => groups.id), // Optional, if this is a group activity
  tripId: integer("trip_id").references(() => trips.id), // Optional, if this is part of a trip
  seatNumber: text("seat_number").notNull(),
  ticketType: text("ticket_type").default("adult"), // adult, child, senior
  price: doublePrecision("price").notNull(),
  discountCode: text("discount_code"),
  status: text("status").default("confirmed"), // confirmed, used, canceled
  qrCode: text("qr_code"), // QR code for ticket
  purchaseDate: timestamp("purchase_date").defaultNow(),
  paymentId: integer("payment_id"), // Reference to a payment/transaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMovieTicketSchema = createInsertSchema(movieTickets).pick({
  showingId: true,
  groupTicketId: true,
  userId: true,
  groupId: true,
  tripId: true,
  seatNumber: true,
  ticketType: true,
  price: true,
  discountCode: true,
});

export type InsertMovieTicket = z.infer<typeof insertMovieTicketSchema>;
export type MovieTicket = typeof movieTickets.$inferSelect;

// Concession Items for movie theater snacks
export const concessionItems = pgTable("concession_items", {
  id: serial("id").primaryKey(),
  theaterId: integer("theater_id").references(() => movieTheaters.id), // Which theater sells this item
  name: text("name").notNull(),
  description: text("description").default(""),
  price: doublePrecision("price").notNull(),
  category: text("category").default("snack"), // snack, drink, combo, etc.
  imageUrl: text("image_url"),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConcessionItemSchema = createInsertSchema(concessionItems).pick({
  theaterId: true,
  name: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  available: true,
});

export type InsertConcessionItem = z.infer<typeof insertConcessionItemSchema>;
export type ConcessionItem = typeof concessionItems.$inferSelect;

// Concession Orders for snack purchases
export const concessionOrders = pgTable("concession_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  movieTicketId: integer("movie_ticket_id").references(() => movieTickets.id), // Optional, to link to specific movie ticket
  theaterId: integer("theater_id").notNull().references(() => movieTheaters.id),
  status: text("status").default("pending"), // pending, preparing, ready, delivered, canceled
  totalAmount: doublePrecision("total_amount").notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  pickupTime: timestamp("pickup_time"),
  deliveryToSeat: boolean("delivery_to_seat").default(false), // Whether to deliver to the seat
  seatNumber: text("seat_number"), // Seat number for delivery
  screenNumber: text("screen_number"), // Screen number for delivery
  paymentId: integer("payment_id"), // Reference to a payment/transaction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConcessionOrderSchema = createInsertSchema(concessionOrders).pick({
  userId: true,
  movieTicketId: true,
  theaterId: true,
  totalAmount: true,
  pickupTime: true,
  deliveryToSeat: true,
  seatNumber: true,
  screenNumber: true,
});

export type InsertConcessionOrder = z.infer<typeof insertConcessionOrderSchema>;
export type ConcessionOrder = typeof concessionOrders.$inferSelect;

// Concession Order Items for items in an order
export const concessionOrderItems = pgTable("concession_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => concessionOrders.id),
  itemId: integer("item_id").notNull().references(() => concessionItems.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(), // Price at the time of order
  specialInstructions: text("special_instructions").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertConcessionOrderItemSchema = createInsertSchema(concessionOrderItems).pick({
  orderId: true,
  itemId: true,
  quantity: true,
  price: true,
  specialInstructions: true,
});

export type InsertConcessionOrderItem = z.infer<typeof insertConcessionOrderItemSchema>;
export type ConcessionOrderItem = typeof concessionOrderItems.$inferSelect;