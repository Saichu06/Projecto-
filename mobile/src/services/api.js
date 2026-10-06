import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'projecto_jwt_token';

// Determine default host based on platform
const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator uses 10.0.2.2 for host localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = getDefaultBaseUrl();

class MobileApiClient {
  constructor() {
    this.baseURL = BASE_URL;
    this.onSessionExpired = null;
  }

  setSessionExpiredHandler(handler) {
    this.onSessionExpired = handler;
  }

  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to read token from SecureStore', e);
      return null;
    }
  }

  async setToken(token) {
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed to write token to SecureStore', e);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          await this.setToken(null);
          if (this.onSessionExpired) {
            this.onSessionExpired('Your session has expired. Please log in again.');
          }
        }
        const error = new Error(data?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data?.errors;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && (error.message.includes('Network') || error.message.includes('fetch'))) {
        const netErr = new Error('No internet connection. Please check your connection and try again.');
        netErr.status = 0;
        throw netErr;
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) {
      await this.setToken(res.data.token);
    }
    return res.data;
  }

  async register(fullName, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
    if (res.data?.token) {
      await this.setToken(res.data.token);
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore
    } finally {
      await this.setToken(null);
    }
  }

  async getMe() {
    const res = await this.request('/auth/me');
    return res.data;
  }

  async updateProfile(fullName) {
    const res = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName }),
    });
    return res.data;
  }

  async changePassword(currentPassword, newPassword) {
    const res = await this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.data;
  }

  // Dashboard
  async getDashboard() {
    const res = await this.request('/dashboard');
    return res.data;
  }

  // Projects
  async getProjects(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/projects${qs}`);
    const result = res.data || [];
    result.pagination = res.pagination;
    return result;
  }

  async getProject(id) {
    const res = await this.request(`/projects/${id}`);
    return res.data;
  }

  async createProject(projectData) {
    const res = await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return res.data;
  }

  async updateProject(id, projectData) {
    const res = await this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return res.data;
  }

  async deleteProject(id) {
    const res = await this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.projectId) query.append('projectId', params.projectId);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/tasks${qs}`);
    const result = res.data || [];
    result.pagination = res.pagination;
    return result;
  }

  async getTask(id) {
    const res = await this.request(`/tasks/${id}`);
    return res.data;
  }

  async createTask(taskData) {
    const res = await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return res.data;
  }

  async updateTask(id, taskData) {
    const res = await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
    return res.data;
  }

  async deleteTask(id) {
    const res = await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  // Register device push token
  async registerPushDevice(token, platform = Platform.OS) {
    const res = await this.request('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
    return res.data;
  }
}

export const mobileApi = new MobileApiClient();
