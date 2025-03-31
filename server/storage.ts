import {
  User,
  InsertUser,
  users,
  ProximitySetting,
  InsertProximitySetting,
  proximitySettings,
  Message,
  InsertMessage,
  messages,
  Group,
  InsertGroup,
  groups,
  GroupMember,
  InsertGroupMember,
  groupMembers,
  GroupMessage,
  InsertGroupMessage,
  groupMessages,
  Expense,
  InsertExpense,
  expenses,
  ExpenseParticipant,
  InsertExpenseParticipant,
  expenseParticipants,
  Activity,
  InsertActivity,
  activities,
  ActivityParticipant,
  InsertActivityParticipant,
  activityParticipants,
  Friend,
  InsertFriend,
  friends,
  GiftSuggestion,
  InsertGiftSuggestion,
  giftSuggestions,
  PaymentMethod,
  InsertPaymentMethod,
  paymentMethods,
  Transaction,
  InsertTransaction,
  transactions,
  GiftOrder,
  InsertGiftOrder,
  giftOrders,
  LanguagePreference,
  InsertLanguagePreference,
  languagePreferences,
  VoiceMessage,
  InsertVoiceMessage,
  voiceMessages,
  CalendarEvent,
  InsertCalendarEvent,
  calendarEvents,
  Notification,
  InsertNotification,
  notifications,
  NotificationPreference,
  InsertNotificationPreference,
  notificationPreferences,
  PrivacySetting,
  InsertPrivacySetting,
  privacySettings
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  updateUserLocation(id: number, latitude: number, longitude: number): Promise<User>;
  
  // Proximity settings
  getProximitySettings(userId: number): Promise<ProximitySetting | undefined>;
  createProximitySettings(settings: InsertProximitySetting): Promise<ProximitySetting>;
  updateProximitySettings(userId: number, settings: Partial<ProximitySetting>): Promise<ProximitySetting>;
  
  // Nearby users
  getNearbyUsers(userId: number, radius: number): Promise<User[]>;
  
  // Messages
  getMessages(userId: number, otherUserId: number): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message>;
  getRecentChats(userId: number): Promise<{ user: User; lastMessage: Message }[]>;
  
  // Groups
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByUser(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<Group>): Promise<Group>;
  
  // Group members
  getGroupMembers(groupId: number): Promise<(GroupMember & { user: User })[]>;
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<void>;
  updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember>;
  
  // Group messages
  getGroupMessages(groupId: number): Promise<(GroupMessage & { sender: User })[]>;
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  
  // Expenses
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByGroup(groupId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<Expense>): Promise<Expense>;
  
  // Expense participants
  getExpenseParticipants(expenseId: number): Promise<(ExpenseParticipant & { user: User })[]>;
  addExpenseParticipant(participant: InsertExpenseParticipant): Promise<ExpenseParticipant>;
  updateExpenseParticipant(expenseId: number, userId: number, paid: boolean): Promise<ExpenseParticipant>;
  
  // Activities
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByGroup(groupId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<Activity>): Promise<Activity>;
  
  // Activity participants
  getActivityParticipants(activityId: number): Promise<(ActivityParticipant & { user: User })[]>;
  getActivityParticipant(activityId: number, userId: number): Promise<ActivityParticipant | undefined>;
  addActivityParticipant(participant: InsertActivityParticipant): Promise<ActivityParticipant>;
  updateActivityParticipant(activityId: number, userId: number, status: string): Promise<ActivityParticipant>;
  
  // Friends
  getFriends(userId: number): Promise<(Friend & { friend: User })[]>;
  getFriendship(userId: number, friendId: number): Promise<Friend | undefined>;
  createFriendRequest(request: InsertFriend): Promise<Friend>;
  updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<Friend>;
  incrementInteractionCount(userId: number, friendId: number): Promise<Friend>;
  getFrequentContacts(userId: number, limit: number): Promise<(Friend & { friend: User })[]>;
  
  // Gift suggestions
  getGiftSuggestions(userId: number): Promise<GiftSuggestion[]>;
  createGiftSuggestion(suggestion: InsertGiftSuggestion): Promise<GiftSuggestion>;
  updateGiftSuggestion(id: number, suggestion: Partial<GiftSuggestion>): Promise<GiftSuggestion>;
  deleteGiftSuggestion(id: number): Promise<void>;
  
  // Payment methods
  getPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, method: Partial<PaymentMethod>): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;
  setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<PaymentMethod>;
  
  // Transactions
  getTransaction(id: number): Promise<Transaction | undefined>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getExpenseTransactions(expenseId: number): Promise<Transaction[]>;
  getGiftTransactions(giftSuggestionId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction>;
  
  // Gift orders
  getGiftOrder(id: number): Promise<GiftOrder | undefined>;
  getUserGiftOrders(userId: number): Promise<GiftOrder[]>;
  getRecipientGiftOrders(recipientId: number): Promise<GiftOrder[]>;
  createGiftOrder(order: InsertGiftOrder): Promise<GiftOrder>;
  updateGiftOrder(id: number, order: Partial<GiftOrder>): Promise<GiftOrder>;
  
  // Language preferences
  getLanguagePreferences(userId: number): Promise<LanguagePreference | undefined>;
  createLanguagePreferences(preferences: InsertLanguagePreference): Promise<LanguagePreference>;
  updateLanguagePreferences(userId: number, preferences: Partial<LanguagePreference>): Promise<LanguagePreference>;
  
  // Privacy settings
  getPrivacySettings(userId: number): Promise<PrivacySetting | undefined>;
  createPrivacySettings(settings: InsertPrivacySetting): Promise<PrivacySetting>;
  updatePrivacySettings(userId: number, settings: Partial<PrivacySetting>): Promise<PrivacySetting>;
  
  // Voice messages
  getVoiceMessage(id: number): Promise<VoiceMessage | undefined>;
  getVoiceMessagesByMessage(messageId: number): Promise<VoiceMessage | undefined>;
  getVoiceMessagesByGroupMessage(groupMessageId: number): Promise<VoiceMessage | undefined>;
  createVoiceMessage(voiceMessage: InsertVoiceMessage): Promise<VoiceMessage>;
  updateVoiceMessage(id: number, voiceMessage: Partial<VoiceMessage>): Promise<VoiceMessage>;
  
  // Calendar events
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getUserCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: number): Promise<void>;
  
  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  
  // Notification preferences
  getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: number, preferences: Partial<NotificationPreference>): Promise<NotificationPreference>;
  
  // Social media accounts
  getSocialMediaAccount(id: number): Promise<SocialMediaAccount | undefined>;
  getUserSocialMediaAccounts(userId: number): Promise<SocialMediaAccount[]>;
  getSocialMediaAccountByPlatform(userId: number, platform: string): Promise<SocialMediaAccount | undefined>;
  createSocialMediaAccount(account: InsertSocialMediaAccount): Promise<SocialMediaAccount>;
  updateSocialMediaAccount(id: number, account: Partial<SocialMediaAccount>): Promise<SocialMediaAccount>;
  deleteSocialMediaAccount(id: number): Promise<void>;
  
  // OAuth providers
  findOrCreateUserByOAuth(
    profile: {
      id: string;
      provider: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
      username?: string;
    }, 
    accessToken: string, 
    refreshToken: string
  ): Promise<User>;
  
  // Facial recognition data
  storeFaceEmbedding(userId: number, embedding: number[], imageUrl?: string): Promise<boolean>;
  getFaceEmbeddings(userId: number): Promise<Array<{embedding: number[], imageUrl?: string}>>;
  getAllFaceEmbeddings(): Promise<Array<{userId: number, embedding: number[], imageUrl?: string}>>;
  identifyUserByFaceEmbedding(embedding: number[], similarityThreshold?: number): Promise<number | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private proximitySettings: Map<number, ProximitySetting>;
  private messages: Map<number, Message>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private groupMessages: Map<number, GroupMessage>;
  private expenses: Map<number, Expense>;
  private expenseParticipants: Map<number, ExpenseParticipant>;
  private activities: Map<number, Activity>;
  private activityParticipants: Map<number, ActivityParticipant>;
  private friends: Map<number, Friend>;
  private giftSuggestions: Map<number, GiftSuggestion>;
  private paymentMethods: Map<number, PaymentMethod>;
  private transactions: Map<number, Transaction>;
  private giftOrders: Map<number, GiftOrder>;
  private languagePreferences: Map<number, LanguagePreference>;
  private privacySettings: Map<number, PrivacySetting>;
  private voiceMessages: Map<number, VoiceMessage>;
  private calendarEvents: Map<number, CalendarEvent>;
  private notifications: Map<number, Notification>;
  private notificationPreferences: Map<number, NotificationPreference>;
  
  private userIdCounter: number;
  private proximitySettingsIdCounter: number;
  private messageIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private groupMessageIdCounter: number;
  private expenseIdCounter: number;
  private expenseParticipantIdCounter: number;
  private activityIdCounter: number;
  private activityParticipantIdCounter: number;
  private friendIdCounter: number;
  private giftSuggestionIdCounter: number;
  private paymentMethodIdCounter: number;
  private transactionIdCounter: number;
  private giftOrderIdCounter: number;
  private languagePreferenceIdCounter: number;
  private privacySettingIdCounter: number;
  private voiceMessageIdCounter: number;
  private calendarEventIdCounter: number;
  private notificationIdCounter: number;
  private notificationPreferenceIdCounter: number;

  constructor() {
    this.users = new Map();
    this.proximitySettings = new Map();
    this.messages = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.groupMessages = new Map();
    this.expenses = new Map();
    this.expenseParticipants = new Map();
    this.activities = new Map();
    this.activityParticipants = new Map();
    this.friends = new Map();
    this.giftSuggestions = new Map();
    this.paymentMethods = new Map();
    this.transactions = new Map();
    this.giftOrders = new Map();
    this.languagePreferences = new Map();
    this.privacySettings = new Map();
    this.voiceMessages = new Map();
    this.calendarEvents = new Map();
    this.notifications = new Map();
    this.notificationPreferences = new Map();
    this.socialMediaAccounts = new Map();
    
    this.userIdCounter = 1;
    this.proximitySettingsIdCounter = 1;
    this.messageIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.groupMessageIdCounter = 1;
    this.expenseIdCounter = 1;
    this.expenseParticipantIdCounter = 1;
    this.activityIdCounter = 1;
    this.activityParticipantIdCounter = 1;
    this.friendIdCounter = 1;
    this.giftSuggestionIdCounter = 1;
    this.paymentMethodIdCounter = 1;
    this.transactionIdCounter = 1;
    this.giftOrderIdCounter = 1;
    this.languagePreferenceIdCounter = 1;
    this.privacySettingIdCounter = 1;
    this.voiceMessageIdCounter = 1;
    this.calendarEventIdCounter = 1;
    this.notificationIdCounter = 1;
    this.notificationPreferenceIdCounter = 1;
    this.socialMediaAccountIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    const user: User = {
      ...insertUser,
      id,
      createdAt: now,
      lastActive: now,
      online: false,
    };
    
    this.users.set(id, user);
    
    // Create default proximity settings for the user
    await this.createProximitySettings({
      userId: id,
      radius: 100,
      visible: true,
      shareLocation: true,
    });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  async updateUserLocation(id: number, latitude: number, longitude: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = {
      ...user,
      location: { latitude, longitude },
      lastActive: new Date(),
    };
    
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Proximity settings
  async getProximitySettings(userId: number): Promise<ProximitySetting | undefined> {
    return Array.from(this.proximitySettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createProximitySettings(settings: InsertProximitySetting): Promise<ProximitySetting> {
    const id = this.proximitySettingsIdCounter++;
    
    const proximitySetting: ProximitySetting = {
      ...settings,
      id,
    };
    
    this.proximitySettings.set(id, proximitySetting);
    
    return proximitySetting;
  }

  async updateProximitySettings(userId: number, settingsData: Partial<ProximitySetting>): Promise<ProximitySetting> {
    const settings = await this.getProximitySettings(userId);
    if (!settings) {
      throw new Error(`Proximity settings for user ${userId} not found`);
    }
    
    const updatedSettings = { ...settings, ...settingsData };
    this.proximitySettings.set(settings.id, updatedSettings);
    
    return updatedSettings;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance * 1000; // Convert to meters
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Nearby users
  async getNearbyUsers(userId: number, radius: number): Promise<User[]> {
    const currentUser = await this.getUser(userId);
    if (!currentUser || !currentUser.location) {
      return [];
    }
    
    const { latitude, longitude } = currentUser.location;
    
    return Array.from(this.users.values())
      .filter((user) => {
        // Skip the current user and users without location
        if (user.id === userId || !user.location) return false;
        
        // Check if user has proximity settings and is visible
        const settings = Array.from(this.proximitySettings.values()).find(
          (settings) => settings.userId === user.id
        );
        
        if (!settings || !settings.visible || !settings.shareLocation) {
          return false;
        }
        
        // Calculate distance
        const distance = this.calculateDistance(
          latitude,
          longitude,
          user.location.latitude,
          user.location.longitude
        );
        
        // Check if within radius
        return distance <= radius;
      });
  }

  // Messages
  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (message) =>
          (message.senderId === userId && message.receiverId === otherUserId) ||
          (message.senderId === otherUserId && message.receiverId === userId)
      )
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    
    const newMessage: Message = {
      ...message,
      id,
      read: false,
      createdAt: new Date(),
    };
    
    this.messages.set(id, newMessage);
    
    // Increment interaction count between the two users
    const friendship = await this.getFriendship(message.senderId, message.receiverId);
    if (friendship && friendship.status === "accepted") {
      await this.incrementInteractionCount(message.senderId, message.receiverId);
    }
    
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<Message> {
    const message = await this.getMessageById(id);
    if (!message) {
      throw new Error(`Message with id ${id} not found`);
    }
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    
    return updatedMessage;
  }

  async getRecentChats(userId: number): Promise<{ user: User; lastMessage: Message }[]> {
    const userMessages = Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );

    // Get unique user IDs
    const uniqueUserIds = new Set<number>();
    userMessages.forEach((message) => {
      const otherId = message.senderId === userId ? message.receiverId : message.senderId;
      uniqueUserIds.add(otherId);
    });

    const result: { user: User; lastMessage: Message }[] = [];

    // For each unique user, get the most recent message
    for (const otherId of uniqueUserIds) {
      const otherUser = await this.getUser(otherId);
      if (!otherUser) continue;

      const messages = await this.getMessages(userId, otherId);
      if (messages.length === 0) continue;

      const lastMessage = messages[messages.length - 1];
      result.push({ user: otherUser, lastMessage });
    }

    // Sort by most recent message
    return result.sort((a, b) => {
      const dateA = a.lastMessage.createdAt instanceof Date 
        ? a.lastMessage.createdAt 
        : new Date(a.lastMessage.createdAt);
      const dateB = b.lastMessage.createdAt instanceof Date 
        ? b.lastMessage.createdAt 
        : new Date(b.lastMessage.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Groups
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByUser(userId: number): Promise<Group[]> {
    const memberGroups = Array.from(this.groupMembers.values())
      .filter((member) => member.userId === userId)
      .map((member) => member.groupId);
    
    return Array.from(this.groups.values())
      .filter((group) => memberGroups.includes(group.id));
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    
    const newGroup: Group = {
      ...group,
      id,
      createdAt: new Date(),
    };
    
    this.groups.set(id, newGroup);
    
    // Add creator as a member with role "creator"
    await this.addGroupMember({
      groupId: id,
      userId: group.creatorId,
      role: "creator",
    });
    
    return newGroup;
  }

  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group> {
    const group = await this.getGroup(id);
    if (!group) {
      throw new Error(`Group with id ${id} not found`);
    }
    
    const updatedGroup = { ...group, ...groupData };
    this.groups.set(id, updatedGroup);
    
    return updatedGroup;
  }

  // Group members
  async getGroupMembers(groupId: number): Promise<(GroupMember & { user: User })[]> {
    const members = Array.from(this.groupMembers.values())
      .filter((member) => member.groupId === groupId);
    
    const result: (GroupMember & { user: User })[] = [];
    
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    
    return result;
  }

  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return Array.from(this.groupMembers.values()).find(
      (member) => member.groupId === groupId && member.userId === userId
    );
  }

  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    
    const newMember: GroupMember = {
      ...member,
      id,
      joinedAt: new Date(),
    };
    
    this.groupMembers.set(id, newMember);
    
    return newMember;
  }

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    const member = await this.getGroupMember(groupId, userId);
    if (member) {
      this.groupMembers.delete(member.id);
    }
  }

  async updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember> {
    const member = await this.getGroupMember(groupId, userId);
    if (!member) {
      throw new Error(`Group member not found`);
    }
    
    const updatedMember = { ...member, role };
    this.groupMembers.set(member.id, updatedMember);
    
    return updatedMember;
  }

  // Group messages
  async getGroupMessages(groupId: number): Promise<(GroupMessage & { sender: User })[]> {
    const groupMsgs = Array.from(this.groupMessages.values())
      .filter((message) => message.groupId === groupId)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
    
    const result: (GroupMessage & { sender: User })[] = [];
    
    for (const message of groupMsgs) {
      const sender = await this.getUser(message.senderId);
      if (sender) {
        result.push({ ...message, sender });
      }
    }
    
    return result;
  }

  async createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const id = this.groupMessageIdCounter++;
    
    const newMessage: GroupMessage = {
      ...message,
      id,
      createdAt: new Date(),
    };
    
    this.groupMessages.set(id, newMessage);
    
    return newMessage;
  }

  // Expenses
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpensesByGroup(groupId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter((expense) => expense.groupId === groupId)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    
    const newExpense: Expense = {
      ...expense,
      id,
      settled: false,
    };
    
    this.expenses.set(id, newExpense);
    
    return newExpense;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<Expense> {
    const expense = await this.getExpense(id);
    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    
    return updatedExpense;
  }

  // Expense participants
  async getExpenseParticipants(expenseId: number): Promise<(ExpenseParticipant & { user: User })[]> {
    const participants = Array.from(this.expenseParticipants.values())
      .filter((participant) => participant.expenseId === expenseId);
    
    const result: (ExpenseParticipant & { user: User })[] = [];
    
    for (const participant of participants) {
      const user = await this.getUser(participant.userId);
      if (user) {
        result.push({ ...participant, user });
      }
    }
    
    return result;
  }

  async addExpenseParticipant(participant: InsertExpenseParticipant): Promise<ExpenseParticipant> {
    const id = this.expenseParticipantIdCounter++;
    
    const newParticipant: ExpenseParticipant = {
      ...participant,
      id,
      paid: false,
    };
    
    this.expenseParticipants.set(id, newParticipant);
    
    return newParticipant;
  }

  async updateExpenseParticipant(expenseId: number, userId: number, paid: boolean): Promise<ExpenseParticipant> {
    const participant = Array.from(this.expenseParticipants.values()).find(
      (p) => p.expenseId === expenseId && p.userId === userId
    );
    
    if (!participant) {
      throw new Error(`Expense participant not found`);
    }
    
    const updatedParticipant = { ...participant, paid };
    this.expenseParticipants.set(participant.id, updatedParticipant);
    
    // Check if all participants have paid, and if so, mark the expense as settled
    const participants = await this.getExpenseParticipants(expenseId);
    const allPaid = participants.every((p) => p.paid);
    
    if (allPaid) {
      const expense = await this.getExpense(expenseId);
      if (expense) {
        await this.updateExpense(expenseId, { settled: true });
      }
    }
    
    return updatedParticipant;
  }

  // Activities
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivitiesByGroup(groupId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.groupId === groupId)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    
    const newActivity: Activity = {
      ...activity,
      id,
      createdAt: new Date(),
    };
    
    this.activities.set(id, newActivity);
    
    // Add creator as a participant with status "going"
    await this.addActivityParticipant({
      activityId: id,
      userId: activity.creatorId,
      status: "going",
    });
    
    return newActivity;
  }

  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity> {
    const activity = await this.getActivity(id);
    if (!activity) {
      throw new Error(`Activity with id ${id} not found`);
    }
    
    const updatedActivity = { ...activity, ...activityData };
    this.activities.set(id, updatedActivity);
    
    return updatedActivity;
  }

  // Activity participants
  async getActivityParticipants(activityId: number): Promise<(ActivityParticipant & { user: User })[]> {
    const participants = Array.from(this.activityParticipants.values())
      .filter((participant) => participant.activityId === activityId);
    
    const result: (ActivityParticipant & { user: User })[] = [];
    
    for (const participant of participants) {
      const user = await this.getUser(participant.userId);
      if (user) {
        result.push({ ...participant, user });
      }
    }
    
    return result;
  }

  async getActivityParticipant(activityId: number, userId: number): Promise<ActivityParticipant | undefined> {
    return Array.from(this.activityParticipants.values()).find(
      (participant) => participant.activityId === activityId && participant.userId === userId
    );
  }

  async addActivityParticipant(participant: InsertActivityParticipant): Promise<ActivityParticipant> {
    const id = this.activityParticipantIdCounter++;
    
    const newParticipant: ActivityParticipant = {
      ...participant,
      id,
    };
    
    this.activityParticipants.set(id, newParticipant);
    
    return newParticipant;
  }

  async updateActivityParticipant(activityId: number, userId: number, status: string): Promise<ActivityParticipant> {
    const participant = await this.getActivityParticipant(activityId, userId);
    if (!participant) {
      throw new Error(`Activity participant not found`);
    }
    
    const updatedParticipant = { ...participant, status };
    this.activityParticipants.set(participant.id, updatedParticipant);
    
    return updatedParticipant;
  }

  // Friends
  async getFriends(userId: number): Promise<(Friend & { friend: User })[]> {
    const userFriends = Array.from(this.friends.values())
      .filter(
        (friendship) =>
          (friendship.userId === userId || friendship.friendId === userId) &&
          friendship.status === "accepted"
      );
    
    const result: (Friend & { friend: User })[] = [];
    
    for (const friendship of userFriends) {
      const friendId =
        friendship.userId === userId ? friendship.friendId : friendship.userId;
      const friend = await this.getUser(friendId);
      
      if (friend) {
        result.push({ ...friendship, friend });
      }
    }
    
    return result;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friend | undefined> {
    return Array.from(this.friends.values()).find(
      (friendship) =>
        (friendship.userId === userId && friendship.friendId === friendId) ||
        (friendship.userId === friendId && friendship.friendId === userId)
    );
  }

  async createFriendRequest(request: InsertFriend): Promise<Friend> {
    const id = this.friendIdCounter++;
    
    const newFriendship: Friend = {
      ...request,
      id,
      status: "pending",
      interactionCount: 0,
      createdAt: new Date(),
    };
    
    this.friends.set(id, newFriendship);
    
    return newFriendship;
  }

  async updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<Friend> {
    const friendship = await this.getFriendship(userId, friendId);
    if (!friendship) {
      throw new Error(`Friendship not found`);
    }
    
    const updatedFriendship = { ...friendship, status };
    this.friends.set(friendship.id, updatedFriendship);
    
    return updatedFriendship;
  }

  async incrementInteractionCount(userId: number, friendId: number): Promise<Friend> {
    const friendship = await this.getFriendship(userId, friendId);
    if (!friendship) {
      throw new Error(`Friendship not found`);
    }
    
    const updatedFriendship = {
      ...friendship,
      interactionCount: friendship.interactionCount + 1,
    };
    
    this.friends.set(friendship.id, updatedFriendship);
    
    return updatedFriendship;
  }

  async getFrequentContacts(userId: number, limit: number): Promise<(Friend & { friend: User })[]> {
    const friends = await this.getFriends(userId);
    
    // Sort by interaction count (descending)
    return friends
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, limit);
  }

  // Gift suggestions
  async getGiftSuggestions(userId: number): Promise<GiftSuggestion[]> {
    return Array.from(this.giftSuggestions.values())
      .filter((suggestion) => suggestion.receiveId === userId);
  }

  async createGiftSuggestion(suggestion: InsertGiftSuggestion): Promise<GiftSuggestion> {
    const id = this.giftSuggestionIdCounter++;
    
    const newSuggestion: GiftSuggestion = {
      ...suggestion,
      id,
      createdAt: new Date(),
    };
    
    this.giftSuggestions.set(id, newSuggestion);
    
    return newSuggestion;
  }

  async updateGiftSuggestion(id: number, suggestionData: Partial<GiftSuggestion>): Promise<GiftSuggestion> {
    const suggestion = this.giftSuggestions.get(id);
    if (!suggestion) {
      throw new Error(`Gift suggestion with id ${id} not found`);
    }
    
    const updatedSuggestion = { ...suggestion, ...suggestionData };
    this.giftSuggestions.set(id, updatedSuggestion);
    
    return updatedSuggestion;
  }

  async deleteGiftSuggestion(id: number): Promise<void> {
    this.giftSuggestions.delete(id);
  }

  // Language preferences
  async getLanguagePreferences(userId: number): Promise<LanguagePreference | undefined> {
    return Array.from(this.languagePreferences.values()).find(
      (preferences) => preferences.userId === userId
    );
  }

  async createLanguagePreferences(preferences: InsertLanguagePreference): Promise<LanguagePreference> {
    const id = this.languagePreferenceIdCounter++;
    
    const languagePreference: LanguagePreference = {
      ...preferences,
      id,
    };
    
    this.languagePreferences.set(id, languagePreference);
    
    return languagePreference;
  }

  async updateLanguagePreferences(userId: number, preferencesData: Partial<LanguagePreference>): Promise<LanguagePreference> {
    const preferences = await this.getLanguagePreferences(userId);
    if (!preferences) {
      throw new Error(`Language preferences for user ${userId} not found`);
    }
    
    const updatedPreferences = { ...preferences, ...preferencesData };
    this.languagePreferences.set(preferences.id, updatedPreferences);
    
    return updatedPreferences;
  }
  
  // Privacy settings
  async getPrivacySettings(userId: number): Promise<PrivacySetting | undefined> {
    return Array.from(this.privacySettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createPrivacySettings(settings: InsertPrivacySetting): Promise<PrivacySetting> {
    const id = this.privacySettingIdCounter++;
    
    const privacySetting: PrivacySetting = {
      ...settings,
      id,
    };
    
    this.privacySettings.set(id, privacySetting);
    
    return privacySetting;
  }

  async updatePrivacySettings(userId: number, settingsData: Partial<PrivacySetting>): Promise<PrivacySetting> {
    const settings = await this.getPrivacySettings(userId);
    if (!settings) {
      throw new Error(`Privacy settings for user ${userId} not found`);
    }
    
    const updatedSettings = { ...settings, ...settingsData };
    this.privacySettings.set(settings.id, updatedSettings);
    
    return updatedSettings;
  }
  
  // Voice messages
  async getVoiceMessage(id: number): Promise<VoiceMessage | undefined> {
    return this.voiceMessages.get(id);
  }

  async getVoiceMessagesByMessage(messageId: number): Promise<VoiceMessage | undefined> {
    return Array.from(this.voiceMessages.values()).find(
      (vm) => vm.messageId === messageId
    );
  }

  async getVoiceMessagesByGroupMessage(groupMessageId: number): Promise<VoiceMessage | undefined> {
    return Array.from(this.voiceMessages.values()).find(
      (vm) => vm.groupMessageId === groupMessageId
    );
  }

  async createVoiceMessage(voiceMessage: InsertVoiceMessage): Promise<VoiceMessage> {
    const id = this.voiceMessageIdCounter++;
    
    const newVoiceMessage: VoiceMessage = {
      ...voiceMessage,
      id,
    };
    
    this.voiceMessages.set(id, newVoiceMessage);
    
    return newVoiceMessage;
  }

  async updateVoiceMessage(id: number, voiceMessageData: Partial<VoiceMessage>): Promise<VoiceMessage> {
    const voiceMessage = await this.getVoiceMessage(id);
    if (!voiceMessage) {
      throw new Error(`Voice message with id ${id} not found`);
    }
    
    const updatedVoiceMessage = { ...voiceMessage, ...voiceMessageData };
    this.voiceMessages.set(id, updatedVoiceMessage);
    
    return updatedVoiceMessage;
  }
  
  // Calendar events
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async getUserCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter((event) => event.userId === userId)
      .sort((a, b) => {
        const dateA = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
        const dateB = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      });
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.calendarEventIdCounter++;
    
    const newEvent: CalendarEvent = {
      ...event,
      id,
    };
    
    this.calendarEvents.set(id, newEvent);
    
    return newEvent;
  }

  async updateCalendarEvent(id: number, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = await this.getCalendarEvent(id);
    if (!event) {
      throw new Error(`Calendar event with id ${id} not found`);
    }
    
    const updatedEvent = { ...event, ...eventData };
    this.calendarEvents.set(id, updatedEvent);
    
    return updatedEvent;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    this.calendarEvents.delete(id);
  }
  
  // Notifications
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId && !notification.read)
      .length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date(),
    };
    
    this.notifications.set(id, newNotification);
    
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = await this.getNotification(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    this.notifications.delete(id);
  }
  
  // Notification preferences
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    return Array.from(this.notificationPreferences.values()).find(
      (preferences) => preferences.userId === userId
    );
  }

  async createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const id = this.notificationPreferenceIdCounter++;
    
    const notificationPreference: NotificationPreference = {
      ...preferences,
      id,
    };
    
    this.notificationPreferences.set(id, notificationPreference);
    
    return notificationPreference;
  }

  async updateNotificationPreferences(userId: number, preferencesData: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences) {
      throw new Error(`Notification preferences for user ${userId} not found`);
    }
    
    const updatedPreferences = { ...preferences, ...preferencesData };
    this.notificationPreferences.set(preferences.id, updatedPreferences);
    
    return updatedPreferences;
  }
  
  // Social media accounts
  private socialMediaAccounts: Map<number, SocialMediaAccount> = new Map();
  private socialMediaAccountIdCounter: number = 1;
  
  async getSocialMediaAccount(id: number): Promise<SocialMediaAccount | undefined> {
    return this.socialMediaAccounts.get(id);
  }
  
  async getUserSocialMediaAccounts(userId: number): Promise<SocialMediaAccount[]> {
    return Array.from(this.socialMediaAccounts.values())
      .filter(account => account.userId === userId);
  }
  
  async getSocialMediaAccountByPlatform(userId: number, platform: string): Promise<SocialMediaAccount | undefined> {
    return Array.from(this.socialMediaAccounts.values())
      .find(account => account.userId === userId && account.platform === platform);
  }
  
  async createSocialMediaAccount(account: InsertSocialMediaAccount): Promise<SocialMediaAccount> {
    const id = this.socialMediaAccountIdCounter++;
    
    const newAccount: SocialMediaAccount = {
      ...account,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.socialMediaAccounts.set(id, newAccount);
    
    return newAccount;
  }
  
  async updateSocialMediaAccount(id: number, accountData: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const account = await this.getSocialMediaAccount(id);
    if (!account) {
      throw new Error(`Social media account with id ${id} not found`);
    }
    
    const updatedAccount = { 
      ...account, 
      ...accountData,
      updatedAt: new Date() 
    };
    
    this.socialMediaAccounts.set(id, updatedAccount);
    
    return updatedAccount;
  }
  
  async deleteSocialMediaAccount(id: number): Promise<void> {
    this.socialMediaAccounts.delete(id);
  }
  
  // OAuth operations
  async findOrCreateUserByOAuth(
    profile: {
      id: string;
      provider: string;
      displayName?: string;
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
      username?: string;
    }, 
    accessToken: string, 
    refreshToken: string
  ): Promise<User> {
    // First, check if we have a social media account for this user
    const existingAccounts = Array.from(this.socialMediaAccounts.values())
      .filter(account => 
        account.platform === profile.provider && 
        account.username === profile.id
      );
    
    if (existingAccounts.length > 0) {
      // We found a linked account, return the associated user
      const userId = existingAccounts[0].userId;
      const user = await this.getUser(userId);
      
      if (!user) {
        throw new Error(`User with id ${userId} not found but has linked social account`);
      }
      
      // Update the tokens
      await this.updateSocialMediaAccount(existingAccounts[0].id, {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
        updatedAt: new Date()
      });
      
      return user;
    }
    
    // No existing account, check if we have a user with matching email
    let user: User | undefined;
    
    if (profile.emails && profile.emails.length > 0) {
      const email = profile.emails[0].value;
      user = await this.getUserByEmail(email);
      
      if (user) {
        // We found a user with this email, link the social account
        await this.createSocialMediaAccount({
          userId: user.id,
          platform: profile.provider,
          username: profile.id,
          displayName: profile.displayName || '',
          profileUrl: '',
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
          isVerified: true,
          isPublic: true
        });
        
        return user;
      }
    }
    
    // No existing user, create one
    const email = profile.emails && profile.emails.length > 0 
      ? profile.emails[0].value 
      : `${profile.id}@${profile.provider}.tralla.user`;
    
    const username = profile.username || 
      (profile.displayName ? profile.displayName.replace(/\s+/g, '').toLowerCase() : `user_${Date.now()}`);
    
    // Generate a random password for OAuth users
    const password = Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15);
    
    // Create the user
    user = await this.createUser({
      username,
      password, // Random password
      email,
      displayName: profile.displayName || username,
      bio: '',
      interests: [],
      avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
      birthday: null,
      location: null,
      online: true,
      lastActive: new Date(),
      createdAt: new Date(),
      confirmPassword: password
    });
    
    // Link the social account
    await this.createSocialMediaAccount({
      userId: user.id,
      platform: profile.provider,
      username: profile.id,
      displayName: profile.displayName || '',
      profileUrl: '',
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      isVerified: true,
      isPublic: true
    });
    
    return user;
  }
  
  // Payment methods
  async getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values())
      .filter((method) => method.userId === userId);
  }

  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    return this.paymentMethods.get(id);
  }

  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.paymentMethodIdCounter++;
    
    const newMethod: PaymentMethod = {
      ...method,
      id,
      default: method.default || false,
    };
    
    this.paymentMethods.set(id, newMethod);
    
    // If this is set as default, unset default on other payment methods
    if (newMethod.default) {
      await this.unsetDefaultPaymentMethods(method.userId, id);
    }
    
    return newMethod;
  }

  async updatePaymentMethod(id: number, methodData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const method = await this.getPaymentMethod(id);
    if (!method) {
      throw new Error(`Payment method with id ${id} not found`);
    }
    
    const updatedMethod = { ...method, ...methodData };
    this.paymentMethods.set(id, updatedMethod);
    
    // If this is set as default, unset default on other payment methods
    if (methodData.default) {
      await this.unsetDefaultPaymentMethods(method.userId, id);
    }
    
    return updatedMethod;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    const method = await this.getPaymentMethod(id);
    if (method) {
      this.paymentMethods.delete(id);
      
      // If this was the default method, set the next one as default
      if (method.default) {
        const methods = await this.getPaymentMethods(method.userId);
        if (methods.length > 0) {
          await this.setDefaultPaymentMethod(method.userId, methods[0].id);
        }
      }
    }
  }

  private async unsetDefaultPaymentMethods(userId: number, exceptId: number): Promise<void> {
    const methods = await this.getPaymentMethods(userId);
    
    for (const method of methods) {
      if (method.id !== exceptId && method.default) {
        method.default = false;
        this.paymentMethods.set(method.id, method);
      }
    }
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<PaymentMethod> {
    const method = await this.getPaymentMethod(paymentMethodId);
    if (!method) {
      throw new Error(`Payment method with id ${paymentMethodId} not found`);
    }
    
    if (method.userId !== userId) {
      throw new Error(`Payment method does not belong to user ${userId}`);
    }
    
    // Unset default for all other payment methods
    await this.unsetDefaultPaymentMethods(userId, paymentMethodId);
    
    // Set this one as default
    method.default = true;
    this.paymentMethods.set(paymentMethodId, method);
    
    return method;
  }
}

export const storage = new MemStorage();
