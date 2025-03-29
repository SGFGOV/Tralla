import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio").default(""),
  interests: text("interests").array(),
  avatar: text("avatar").default(""),
  location: jsonb("location").$type<{ latitude: number; longitude: number }>(),
  birthday: timestamp("birthday"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  online: boolean("online").default(false),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    displayName: true,
    bio: true,
    interests: true,
    avatar: true,
    birthday: true,
  })
  .extend({
    confirmPassword: z.string(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Proximity settings
export const proximitySettings = pgTable("proximity_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  radius: integer("radius").default(100),
  visible: boolean("visible").default(true),
  shareLocation: boolean("share_location").default(true),
});

export const insertProximitySettingSchema = createInsertSchema(proximitySettings).pick({
  userId: true,
  radius: true,
  visible: true,
  shareLocation: true,
});

export type InsertProximitySetting = z.infer<typeof insertProximitySettingSchema>;
export type ProximitySetting = typeof proximitySettings.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, virtual_hug, virtual_kiss
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  type: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Groups table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  icon: text("icon").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  creatorId: true,
  icon: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").default("member"), // creator, admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

// Group messages table
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, virtual_hug, virtual_kiss, event, expense
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).pick({
  groupId: true,
  senderId: true,
  content: true,
  type: true,
});

export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  name: text("name").notNull(),
  amount: doublePrecision("amount").notNull(),
  payerId: integer("payer_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow(),
  settled: boolean("settled").default(false),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  groupId: true,
  name: true,
  amount: true,
  payerId: true,
  date: true,
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Expense participants
export const expenseParticipants = pgTable("expense_participants", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull().references(() => expenses.id),
  userId: integer("user_id").notNull().references(() => users.id),
  share: doublePrecision("share").notNull(),
  paid: boolean("paid").default(false),
});

export const insertExpenseParticipantSchema = createInsertSchema(expenseParticipants).pick({
  expenseId: true,
  userId: true,
  share: true,
});

export type InsertExpenseParticipant = z.infer<typeof insertExpenseParticipantSchema>;
export type ExpenseParticipant = typeof expenseParticipants.$inferSelect;

// Group activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id),
  name: text("name").notNull(),
  description: text("description").default(""),
  date: timestamp("date").notNull(),
  location: text("location").default(""),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  groupId: true,
  name: true,
  description: true,
  date: true,
  location: true,
  creatorId: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Activity participants
export const activityParticipants = pgTable("activity_participants", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, going, not_going
});

export const insertActivityParticipantSchema = createInsertSchema(activityParticipants).pick({
  activityId: true,
  userId: true,
  status: true,
});

export type InsertActivityParticipant = z.infer<typeof insertActivityParticipantSchema>;
export type ActivityParticipant = typeof activityParticipants.$inferSelect;

// Friends table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").default("pending"), // pending, accepted, rejected
  interactionCount: integer("interaction_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
});

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

// Gift suggestions
export const giftSuggestions = pgTable("gift_suggestions", {
  id: serial("id").primaryKey(),
  receiveId: integer("receive_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").default(""),
  price: doublePrecision("price"),
  link: text("link").default(""),
  category: text("category").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiftSuggestionSchema = createInsertSchema(giftSuggestions).pick({
  receiveId: true,
  name: true,
  description: true,
  price: true,
  link: true,
  category: true,
});

export type InsertGiftSuggestion = z.infer<typeof insertGiftSuggestionSchema>;
export type GiftSuggestion = typeof giftSuggestions.$inferSelect;

// Payment methods 
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // stripe, upi, etc
  token: text("token").notNull(), // Token or payment method ID from the payment provider
  last4: text("last4"), // Last 4 digits of card if applicable
  expiryMonth: integer("expiry_month"), // Expiry month if card
  expiryYear: integer("expiry_year"), // Expiry year if card
  brand: text("brand"), // Card brand if applicable (visa, mastercard, etc)
  isDefault: boolean("is_default").default(false),
  upiId: text("upi_id"), // For UPI payments
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  type: true,
  token: true,
  last4: true,
  expiryMonth: true,
  expiryYear: true,
  brand: true,
  isDefault: true,
  upiId: true,
});

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").default("USD"),
  description: text("description").notNull(),
  status: text("status").notNull(), // pending, completed, failed
  paymentMethodId: integer("payment_method_id").references(() => paymentMethods.id),
  expenseId: integer("expense_id").references(() => expenses.id),
  giftSuggestionId: integer("gift_suggestion_id").references(() => giftSuggestions.id),
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  currency: true,
  description: true,
  status: true,
  paymentMethodId: true,
  expenseId: true,
  giftSuggestionId: true,
  paymentIntentId: true,
  stripeCustomerId: true,
  metadata: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Gift orders
export const giftOrders = pgTable("gift_orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  giftSuggestionId: integer("gift_suggestion_id").references(() => giftSuggestions.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  status: text("status").notNull(), // pending, ordered, shipped, delivered
  trackingInfo: text("tracking_info"),
  deliveryAddress: jsonb("delivery_address").$type<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGiftOrderSchema = createInsertSchema(giftOrders).pick({
  buyerId: true,
  recipientId: true,
  giftSuggestionId: true,
  transactionId: true,
  status: true,
  trackingInfo: true,
  deliveryAddress: true,
});

export type InsertGiftOrder = z.infer<typeof insertGiftOrderSchema>;
export type GiftOrder = typeof giftOrders.$inferSelect;
