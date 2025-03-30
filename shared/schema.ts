import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Language } from "./i18n";

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

// Language preferences table
export const languagePreferences = pgTable("language_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  primaryLanguage: text("primary_language").notNull().default(Language.ENGLISH), // Default language
  secondaryLanguages: text("secondary_languages").array(), // Additional languages the user knows
  autoTranslate: boolean("auto_translate").default(true), // Automatically translate incoming messages
  autoDetectLanguage: boolean("auto_detect_language").default(true), // Auto detect message language
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLanguagePreferenceSchema = createInsertSchema(languagePreferences).pick({
  userId: true,
  primaryLanguage: true,
  secondaryLanguages: true,
  autoTranslate: true,
  autoDetectLanguage: true,
});

export type InsertLanguagePreference = z.infer<typeof insertLanguagePreferenceSchema>;
export type LanguagePreference = typeof languagePreferences.$inferSelect;

// Voice messages table
export const voiceMessages = pgTable("voice_messages", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id), // For direct messages
  groupMessageId: integer("group_message_id").references(() => groupMessages.id), // For group messages
  audioUrl: text("audio_url").notNull(), // URL to the stored audio file
  duration: integer("duration").notNull(), // Duration in seconds
  transcription: text("transcription"), // Optional transcription of voice message
  transcriptionLanguage: text("transcription_language"), // Language of the transcription
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoiceMessageSchema = createInsertSchema(voiceMessages).pick({
  messageId: true,
  groupMessageId: true,
  audioUrl: true,
  duration: true,
  transcription: true,
  transcriptionLanguage: true,
});

export type InsertVoiceMessage = z.infer<typeof insertVoiceMessageSchema>;
export type VoiceMessage = typeof voiceMessages.$inferSelect;

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Owner of the calendar event
  title: text("title").notNull(),
  description: text("description").default(""),
  location: text("location").default(""),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  recurrence: text("recurrence"), // RRULE format for recurring events
  activityId: integer("activity_id").references(() => activities.id), // Linked activity if any
  reminderMinutes: integer("reminder_minutes").array(), // Array of reminder times in minutes before event
  calendarId: text("calendar_id"), // External calendar ID if synced
  externalEventId: text("external_event_id"), // External event ID if synced
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  userId: true,
  title: true,
  description: true,
  location: true,
  startTime: true,
  endTime: true,
  allDay: true,
  recurrence: true,
  activityId: true,
  reminderMinutes: true,
  calendarId: true,
  externalEventId: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  newMessageEnabled: boolean("new_message_enabled").default(true),
  groupMessageEnabled: boolean("group_message_enabled").default(true),
  proximityAlertEnabled: boolean("proximity_alert_enabled").default(true),
  friendRequestEnabled: boolean("friend_request_enabled").default(true),
  eventReminderEnabled: boolean("event_reminder_enabled").default(true),
  expenseUpdatesEnabled: boolean("expense_updates_enabled").default(true),
  promotionsEnabled: boolean("promotions_enabled").default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
  doNotDisturbFrom: text("do_not_disturb_from"), // Time in format 'HH:MM'
  doNotDisturbTo: text("do_not_disturb_to"), // Time in format 'HH:MM'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).pick({
  userId: true,
  newMessageEnabled: true,
  groupMessageEnabled: true,
  proximityAlertEnabled: true,
  friendRequestEnabled: true,
  eventReminderEnabled: true,
  expenseUpdatesEnabled: true,
  promotionsEnabled: true,
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  doNotDisturbFrom: true,
  doNotDisturbTo: true,
});

export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // message, friend_request, proximity_alert, expense, event, etc.
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false),
  actionUrl: text("action_url"), // Deep link to navigate to when notification is clicked
  relatedUserId: integer("related_user_id").references(() => users.id), // User related to notification if any
  relatedEntityId: integer("related_entity_id"), // ID of related entity (message, group, activity, etc.)
  relatedEntityType: text("related_entity_type"), // Type of related entity (message, group, activity, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  body: true,
  read: true,
  actionUrl: true,
  relatedUserId: true,
  relatedEntityId: true,
  relatedEntityType: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Privacy settings table
export const privacySettings = pgTable("privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  showOnlineStatus: boolean("show_online_status").default(true),
  showLastActive: boolean("show_last_active").default(true),
  allowFriendRequests: boolean("allow_friend_requests").default(true),
  allowProximityDiscovery: boolean("allow_proximity_discovery").default(true),
  allowLocationSharing: boolean("allow_location_sharing").default(true),
  showBirthday: boolean("show_birthday").default(true),
  showEmail: boolean("show_email").default(false),
  profileVisibility: text("profile_visibility").default("public"), // public, friends, private
  messagesFromNonFriends: boolean("messages_from_non_friends").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrivacySettingSchema = createInsertSchema(privacySettings).pick({
  userId: true,
  showOnlineStatus: true,
  showLastActive: true,
  allowFriendRequests: true,
  allowProximityDiscovery: true,
  allowLocationSharing: true,
  showBirthday: true,
  showEmail: true,
  profileVisibility: true,
  messagesFromNonFriends: true,
});

export type InsertPrivacySetting = z.infer<typeof insertPrivacySettingSchema>;
export type PrivacySetting = typeof privacySettings.$inferSelect;

// Social media accounts table
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, etc.
  username: text("username").notNull(),
  displayName: text("display_name"),
  profileUrl: text("profile_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isVerified: boolean("is_verified").default(false),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts).pick({
  userId: true,
  platform: true,
  username: true,
  displayName: true,
  profileUrl: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiry: true,
  isVerified: true,
  isPublic: true,
});

export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;
export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
