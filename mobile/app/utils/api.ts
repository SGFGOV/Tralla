import axios from 'axios';
import { Platform } from 'react-native';

// Configure the base URL depending on platform and environment
const API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api', // Android emulator uses this IP to access host's localhost
  default: 'http://localhost:3000/api',
});

// Create axios instance with default configs
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config) => {
    // Get the auth token from AsyncStorage
    const token = await getAuthToken();
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh logic
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          const token = await getAuthToken();
          apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Handle failed refresh (log out, etc.)
        handleLogout();
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth token from AsyncStorage
// This would be replaced with actual AsyncStorage implementation
const getAuthToken = async () => {
  // This is a placeholder - implement with AsyncStorage
  return null;
};

// Helper function to refresh token
// This would be replaced with actual refresh token logic
const refreshToken = async () => {
  // This is a placeholder - implement with your token refresh logic
  return false;
};

// Helper function to handle logout
// This would be replaced with actual logout logic
const handleLogout = () => {
  // This is a placeholder - implement with your logout logic
};

// Api functions for different endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (username: string, password: string) =>
      apiClient.post('/auth/login', { username, password }),
    register: (userData: any) =>
      apiClient.post('/auth/register', userData),
    logout: () =>
      apiClient.post('/auth/logout'),
  },
  
  // User endpoints
  users: {
    getProfile: (id: number) =>
      apiClient.get(`/users/${id}`),
    updateProfile: (id: number, userData: any) =>
      apiClient.patch(`/users/${id}`, userData),
    getProximitySettings: (id: number) =>
      apiClient.get(`/users/${id}/proximity-settings`),
    updateProximitySettings: (id: number, settings: any) =>
      apiClient.patch(`/users/${id}/proximity-settings`, settings),
    getNearbyUsers: (id: number) =>
      apiClient.get(`/users/${id}/nearby`),
    getFriends: (id: number) =>
      apiClient.get(`/users/${id}/friends`),
    getFrequentContacts: (id: number) =>
      apiClient.get(`/users/${id}/frequent-contacts`),
    getGiftSuggestions: (id: number) =>
      apiClient.get(`/users/${id}/gift-suggestions`),
  },
  
  // Messages endpoints
  messages: {
    getMessages: (userId: number, otherUserId: number) =>
      apiClient.get(`/messages/${userId}/${otherUserId}`),
    sendMessage: (messageData: any) =>
      apiClient.post('/messages', messageData),
    markAsRead: (id: number) =>
      apiClient.patch(`/messages/${id}/read`),
    getChats: (userId: number) =>
      apiClient.get(`/users/${userId}/chats`),
  },
  
  // Groups endpoints
  groups: {
    getGroup: (id: number) =>
      apiClient.get(`/groups/${id}`),
    getUserGroups: (userId: number) =>
      apiClient.get(`/users/${userId}/groups`),
    createGroup: (groupData: any) =>
      apiClient.post('/groups', groupData),
    updateGroup: (id: number, groupData: any) =>
      apiClient.patch(`/groups/${id}`, groupData),
    getMembers: (id: number) =>
      apiClient.get(`/groups/${id}/members`),
    addMember: (id: number, memberData: any) =>
      apiClient.post(`/groups/${id}/members`, memberData),
    removeMember: (groupId: number, userId: number) =>
      apiClient.delete(`/groups/${groupId}/members/${userId}`),
    updateMemberRole: (groupId: number, userId: number, role: string) =>
      apiClient.patch(`/groups/${groupId}/members/${userId}/role`, { role }),
    getMessages: (id: number) =>
      apiClient.get(`/groups/${id}/messages`),
    sendMessage: (id: number, messageData: any) =>
      apiClient.post(`/groups/${id}/messages`, messageData),
  },
  
  // Expenses endpoints
  expenses: {
    getExpense: (id: number) =>
      apiClient.get(`/expenses/${id}`),
    getGroupExpenses: (groupId: number) =>
      apiClient.get(`/groups/${groupId}/expenses`),
    createExpense: (expenseData: any) =>
      apiClient.post('/expenses', expenseData),
    updateExpense: (id: number, expenseData: any) =>
      apiClient.patch(`/expenses/${id}`, expenseData),
    getParticipants: (id: number) =>
      apiClient.get(`/expenses/${id}/participants`),
    addParticipant: (id: number, participantData: any) =>
      apiClient.post(`/expenses/${id}/participants`, participantData),
    markAsPaid: (expenseId: number, userId: number) =>
      apiClient.patch(`/expenses/${expenseId}/participants/${userId}/paid`, { paid: true }),
  },
  
  // Activities endpoints
  activities: {
    getActivity: (id: number) =>
      apiClient.get(`/activities/${id}`),
    getGroupActivities: (groupId: number) =>
      apiClient.get(`/groups/${groupId}/activities`),
    createActivity: (activityData: any) =>
      apiClient.post('/activities', activityData),
    updateActivity: (id: number, activityData: any) =>
      apiClient.patch(`/activities/${id}`, activityData),
    getParticipants: (id: number) =>
      apiClient.get(`/activities/${id}/participants`),
    addParticipant: (id: number, participantData: any) =>
      apiClient.post(`/activities/${id}/participants`, participantData),
    updateStatus: (activityId: number, userId: number, status: string) =>
      apiClient.patch(`/activities/${activityId}/participants/${userId}/status`, { status }),
  },
  
  // Friend requests and relationships
  friends: {
    sendRequest: (requestData: any) =>
      apiClient.post('/friend-requests', requestData),
    updateRequestStatus: (userId: number, friendId: number, status: string) =>
      apiClient.patch(`/friend-requests/${userId}/${friendId}/status`, { status }),
  },
  
  // Gift suggestions
  gifts: {
    createSuggestion: (suggestionData: any) =>
      apiClient.post('/gift-suggestions', suggestionData),
    updateSuggestion: (id: number, suggestionData: any) =>
      apiClient.patch(`/gift-suggestions/${id}`, suggestionData),
    deleteSuggestion: (id: number) =>
      apiClient.delete(`/gift-suggestions/${id}`),
  },
};

export default api;