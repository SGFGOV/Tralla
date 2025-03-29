/**
 * Application-wide constants
 */

// API Routes
export const API_ROUTES = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
  },
  USERS: {
    GET: (id: number) => `/api/users/${id}`,
    UPDATE: (id: number) => `/api/users/${id}`,
    NEARBY: (id: number) => `/api/users/${id}/nearby`,
    PROXIMITY_SETTINGS: (id: number) => `/api/users/${id}/proximity-settings`,
    CHATS: (id: number) => `/api/users/${id}/chats`,
    FRIENDS: (id: number) => `/api/users/${id}/friends`,
    FREQUENT_CONTACTS: (id: number) => `/api/users/${id}/frequent-contacts`,
  },
  MESSAGES: {
    BETWEEN: (userId: number, otherUserId: number) => `/api/messages/${userId}/${otherUserId}`,
    CREATE: '/api/messages',
    MARK_READ: (id: number) => `/api/messages/${id}/read`,
  },
  GROUPS: {
    LIST: (userId: number) => `/api/users/${userId}/groups`,
    GET: (id: number) => `/api/groups/${id}`,
    CREATE: '/api/groups',
    UPDATE: (id: number) => `/api/groups/${id}`,
    MEMBERS: (id: number) => `/api/groups/${id}/members`,
    MESSAGES: (id: number) => `/api/groups/${id}/messages`,
  },
  EXPENSES: {
    LIST: (groupId: number) => `/api/groups/${groupId}/expenses`,
    GET: (id: number) => `/api/expenses/${id}`,
    CREATE: '/api/expenses',
    PARTICIPANTS: (id: number) => `/api/expenses/${id}/participants`,
  },
  ACTIVITIES: {
    LIST: (groupId: number) => `/api/groups/${groupId}/activities`,
    GET: (id: number) => `/api/activities/${id}`,
    CREATE: '/api/activities',
    PARTICIPANTS: (id: number) => `/api/activities/${id}/participants`,
  },
  GIFTS: {
    SUGGESTIONS: (userId: number) => `/api/users/${userId}/gift-suggestions`,
    CREATE: '/api/gift-suggestions',
  },
};

// Device Types
export const DEVICE_TYPES = {
  PHONE: 'phone',
  WATCH: 'watch',
  GLASS: 'glass',
} as const;

// Virtual Interaction Types
export const INTERACTION_TYPES = {
  HUG: 'virtual_hug',
  KISS: 'virtual_kiss',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  VIRTUAL_HUG: 'virtual_hug',
  VIRTUAL_KISS: 'virtual_kiss',
} as const;

// Friend Status Types
export const FRIEND_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  PROXIMITY_RADIUS: 100, // meters
  LOCATION_REFRESH_INTERVAL: 30000, // 30 seconds
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  DEVICE_PREFERENCE: 'device_preference',
};

// WebSocket Events
export const WS_EVENTS = {
  AUTH: 'auth',
  LOCATION_UPDATE: 'location_update',
  NEARBY_USERS: 'nearby_users',
  NEW_MESSAGE: 'new_message',
  MESSAGE_SENT: 'message_sent',
  NEW_GROUP_MESSAGE: 'new_group_message',
  VIRTUAL_INTERACTION: 'virtual_interaction',
  USER_STATUS_CHANGE: 'user_status_change',
};

// App Routes
export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  NEARBY: '/nearby',
  CHATS: '/chats',
  CHAT_DETAIL: (id: number) => `/chats/${id}`,
  GROUPS: '/groups',
  GROUP_DETAIL: (id: number) => `/groups/${id}`,
  PROFILE: '/profile',
  PROFILE_DETAIL: (id: number) => `/profile/${id}`,
};
