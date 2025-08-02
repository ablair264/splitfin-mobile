// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

// Replace with your actual API URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.splitfin.com';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          await this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const user = auth().currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async handleAuthError() {
    try {
      // Try to refresh token
      const user = auth().currentUser;
      if (user) {
        await user.getIdToken(true);
      } else {
        // Redirect to login
        await auth().signOut();
      }
    } catch (error) {
      console.error('Error handling auth error:', error);
      await auth().signOut();
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // API endpoints
  auth = {
    login: (email: string, password: string) =>
      this.post('/auth/login', { email, password }),
    
    signup: (data: { email: string; password: string; displayName: string }) =>
      this.post('/auth/signup', data),
    
    resetPassword: (email: string) =>
      this.post('/auth/reset-password', { email }),
  };

  products = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
      this.get('/products', { params }),
    
    getById: (id: string) =>
      this.get(`/products/${id}`),
    
    search: (query: string) =>
      this.get('/products/search', { params: { q: query } }),
  };

  orders = {
    getAll: (params?: { page?: number; limit?: number; status?: string }) =>
      this.get('/orders', { params }),
    
    getById: (id: string) =>
      this.get(`/orders/${id}`),
    
    create: (data: any) =>
      this.post('/orders', data),
    
    update: (id: string, data: any) =>
      this.put(`/orders/${id}`, data),
  };

  customers = {
    getAll: (params?: { page?: number; limit?: number; search?: string }) =>
      this.get('/customers', { params }),
    
    getById: (id: string) =>
      this.get(`/customers/${id}`),
    
    create: (data: any) =>
      this.post('/customers', data),
    
    update: (id: string, data: any) =>
      this.put(`/customers/${id}`, data),
  };

  dashboard = {
    getMetrics: (dateRange?: string) =>
      this.get('/dashboard/metrics', { params: { dateRange } }),
    
    getChartData: (type: string, dateRange?: string) =>
      this.get(`/dashboard/charts/${type}`, { params: { dateRange } }),
  };
}

export default new ApiService();
