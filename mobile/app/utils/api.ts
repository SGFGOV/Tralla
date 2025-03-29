import axios from 'axios';
import { Platform } from 'react-native';

// Base URL configuration
const API_URL = __DEV__ 
  ? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api')
  : 'https://api.gettralla.com/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // You can modify request config here (add auth tokens, etc.)
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // You can modify response data here
    return response;
  },
  (error) => {
    // Handle errors (e.g., refresh token, show error notification)
    console.error('Response error:', error);
    return Promise.reject(error);
  }
);

// API methods

// Generic fetch data method
export const fetchData = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await api.get<T>(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

// Post data method
export const postData = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    const response = await api.post<T>(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error;
  }
};

// Put data method
export const putData = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    const response = await api.put<T>(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error putting data to ${endpoint}:`, error);
    throw error;
  }
};

// Patch data method
export const patchData = async <T>(endpoint: string, data: any): Promise<T> => {
  try {
    const response = await api.patch<T>(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error patching data to ${endpoint}:`, error);
    throw error;
  }
};

// Delete data method
export const deleteData = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await api.delete<T>(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data from ${endpoint}:`, error);
    throw error;
  }
};

// Method to check if API is reachable
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

export default api;