import { IStorage } from './storage';
import {
  Restaurant,
  InsertRestaurant,
  RestaurantReservation,
  InsertRestaurantReservation,
  RestaurantReservationParticipant,
  InsertRestaurantReservationParticipant,
  MovieTheater,
  InsertMovieTheater,
  Movie,
  InsertMovie,
  MovieShowing,
  InsertMovieShowing,
  MovieTicket,
  InsertMovieTicket,
  ConcessionItem,
  InsertConcessionItem,
  ConcessionOrder,
  InsertConcessionOrder,
  ConcessionOrderItem,
  InsertConcessionOrderItem,
  User,
  Vendor,
  InsertVendor,
  DiscountCode,
  InsertDiscountCode,
  UserDiscountUsage,
  InsertUserDiscountUsage
} from '@shared/schema';

// Extension interface for the restaurant/dining features
export interface IDiningStorage {
  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurantsByCuisine(cuisine: string): Promise<Restaurant[]>;
  getRestaurantsByLocation(location: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<Restaurant>): Promise<Restaurant>;
  deleteRestaurant(id: number): Promise<void>;
  
  // Restaurant Reservation operations
  getRestaurantReservation(id: number): Promise<RestaurantReservation | undefined>;
  getRestaurantReservationsByUser(userId: number): Promise<RestaurantReservation[]>;
  getRestaurantReservationsByGroup(groupId: number): Promise<RestaurantReservation[]>;
  getRestaurantReservationsByTrip(tripId: number): Promise<RestaurantReservation[]>;
  getRestaurantReservationsByRestaurant(restaurantId: number): Promise<RestaurantReservation[]>;
  createRestaurantReservation(reservation: InsertRestaurantReservation): Promise<RestaurantReservation>;
  updateRestaurantReservation(id: number, reservation: Partial<RestaurantReservation>): Promise<RestaurantReservation>;
  cancelRestaurantReservation(id: number): Promise<RestaurantReservation>;
  
  // Restaurant Reservation Participant operations
  getRestaurantReservationParticipants(reservationId: number): Promise<(RestaurantReservationParticipant & { user: User })[]>;
  getRestaurantReservationParticipant(reservationId: number, userId: number): Promise<RestaurantReservationParticipant | undefined>;
  addRestaurantReservationParticipant(participant: InsertRestaurantReservationParticipant): Promise<RestaurantReservationParticipant>;
  updateRestaurantReservationParticipantStatus(reservationId: number, userId: number, status: string): Promise<RestaurantReservationParticipant>;
  removeRestaurantReservationParticipant(reservationId: number, userId: number): Promise<void>;
}

// Extension interface for the movie theater features
export interface IMovieStorage {
  // Movie Theater operations
  getMovieTheater(id: number): Promise<MovieTheater | undefined>;
  getMovieTheaters(): Promise<MovieTheater[]>;
  getMovieTheatersByLocation(location: string): Promise<MovieTheater[]>;
  createMovieTheater(theater: InsertMovieTheater): Promise<MovieTheater>;
  updateMovieTheater(id: number, theater: Partial<MovieTheater>): Promise<MovieTheater>;
  deleteMovieTheater(id: number): Promise<void>;
  
  // Movie operations
  getMovie(id: number): Promise<Movie | undefined>;
  getMovies(): Promise<Movie[]>;
  getMoviesByGenre(genre: string): Promise<Movie[]>;
  getMoviesByTheater(theaterId: number): Promise<Movie[]>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<Movie>): Promise<Movie>;
  deleteMovie(id: number): Promise<void>;
  
  // Movie Showing operations
  getMovieShowing(id: number): Promise<MovieShowing | undefined>;
  getMovieShowingsByMovie(movieId: number): Promise<MovieShowing[]>;
  getMovieShowingsByTheater(theaterId: number): Promise<MovieShowing[]>;
  getMovieShowingsByDateRange(theaterId: number, startDate: Date, endDate: Date): Promise<MovieShowing[]>;
  createMovieShowing(showing: InsertMovieShowing): Promise<MovieShowing>;
  updateMovieShowing(id: number, showing: Partial<MovieShowing>): Promise<MovieShowing>;
  updateMovieShowingAvailability(id: number, seatsTaken: string[]): Promise<MovieShowing>;
  cancelMovieShowing(id: number): Promise<MovieShowing>;
  
  // Movie Ticket operations
  getMovieTicket(id: number): Promise<MovieTicket | undefined>;
  getMovieTicketsByUser(userId: number): Promise<MovieTicket[]>;
  getMovieTicketsByGroup(groupId: number): Promise<MovieTicket[]>;
  getMovieTicketsByTrip(tripId: number): Promise<MovieTicket[]>;
  getMovieTicketsByShowing(showingId: number): Promise<MovieTicket[]>;
  createMovieTicket(ticket: InsertMovieTicket): Promise<MovieTicket>;
  updateMovieTicket(id: number, ticket: Partial<MovieTicket>): Promise<MovieTicket>;
  cancelMovieTicket(id: number): Promise<MovieTicket>;
  getGroupMovieTickets(groupTicketId: number): Promise<MovieTicket[]>;
  
  // Concession Item operations
  getConcessionItem(id: number): Promise<ConcessionItem | undefined>;
  getConcessionItemsByTheater(theaterId: number): Promise<ConcessionItem[]>;
  getConcessionItemsByCategory(theaterId: number, category: string): Promise<ConcessionItem[]>;
  createConcessionItem(item: InsertConcessionItem): Promise<ConcessionItem>;
  updateConcessionItem(id: number, item: Partial<ConcessionItem>): Promise<ConcessionItem>;
  deleteConcessionItem(id: number): Promise<void>;
  
  // Concession Order operations
  getConcessionOrder(id: number): Promise<ConcessionOrder | undefined>;
  getConcessionOrdersByUser(userId: number): Promise<ConcessionOrder[]>;
  getConcessionOrdersByTheater(theaterId: number): Promise<ConcessionOrder[]>;
  getConcessionOrdersByTicket(movieTicketId: number): Promise<ConcessionOrder[]>;
  createConcessionOrder(order: InsertConcessionOrder): Promise<ConcessionOrder>;
  updateConcessionOrder(id: number, order: Partial<ConcessionOrder>): Promise<ConcessionOrder>;
  updateConcessionOrderStatus(id: number, status: string): Promise<ConcessionOrder>;
  cancelConcessionOrder(id: number): Promise<ConcessionOrder>;
  
  // Concession Order Item operations
  getConcessionOrderItems(orderId: number): Promise<(ConcessionOrderItem & { item: ConcessionItem })[]>;
  getConcessionOrderItem(orderId: number, itemId: number): Promise<ConcessionOrderItem | undefined>;
  addConcessionOrderItem(orderItem: InsertConcessionOrderItem): Promise<ConcessionOrderItem>;
  updateConcessionOrderItemQuantity(orderId: number, itemId: number, quantity: number): Promise<ConcessionOrderItem>;
  removeConcessionOrderItem(orderId: number, itemId: number): Promise<void>;
}

// Interface for vendor operations
export interface IVendorStorage {
  // Vendor operations
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  getVendorsByBusinessType(businessType: string): Promise<Vendor[]>;
  getVendorByBusinessTypeAndId(businessType: string, businessId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor>;
  updateVendorLastLogin(id: number): Promise<Vendor>;
  verifyVendor(id: number): Promise<Vendor>;
  deactivateVendor(id: number): Promise<Vendor>;
  
  // Authentication
  authenticateVendor(email: string, password: string): Promise<Vendor | null>;
  
  // Discount Code operations
  getDiscountCode(id: number): Promise<DiscountCode | undefined>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  getDiscountCodesByVendor(vendorId: number): Promise<DiscountCode[]>;
  getActiveDiscountCodesByVendor(vendorId: number): Promise<DiscountCode[]>;
  createDiscountCode(discountCode: InsertDiscountCode): Promise<DiscountCode>;
  updateDiscountCode(id: number, discountCode: Partial<DiscountCode>): Promise<DiscountCode>;
  incrementDiscountCodeUsage(id: number): Promise<DiscountCode>;
  deactivateDiscountCode(id: number): Promise<DiscountCode>;
  validateDiscountCode(code: string, purchaseAmount: number): Promise<{ 
    valid: boolean; 
    discountCode?: DiscountCode; 
    finalAmount?: number; 
    message?: string;
  }>;
  
  // User Discount Usage
  getUserDiscountUsage(userId: number, discountCodeId: number): Promise<UserDiscountUsage | undefined>;
  incrementUserDiscountUsage(userId: number, discountCodeId: number): Promise<UserDiscountUsage>;
  
  // Restaurant management for vendors
  getVendorRestaurants(vendorId: number): Promise<Restaurant[]>;
  
  // Movie Theater management for vendors
  getVendorMovieTheaters(vendorId: number): Promise<MovieTheater[]>;
  
  // Reservation/Order stats for vendors
  getRestaurantReservationStats(restaurantId: number): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    canceled: number;
    completed: number;
    todayReservations: number;
    upcomingReservations: number;
  }>;
  
  getMovieShowingStats(theaterId: number): Promise<{
    totalShowings: number;
    upcomingShowings: number;
    soldOutShowings: number;
    totalTicketsSold: number;
    totalRevenue: number;
    occupancyRate: number;
  }>;
  
  getConcessionStats(theaterId: number): Promise<{
    totalOrders: number;
    totalRevenue: number;
    popularItems: { itemId: number; name: string; quantity: number; revenue: number }[];
  }>;
}

// Extended Storage Interface
export interface IExtendedStorage extends IStorage, IDiningStorage, IMovieStorage, IVendorStorage {}