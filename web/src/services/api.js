const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return localStorage.getItem('projecto_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('projecto_token', token);
    } else {
      localStorage.removeItem('projecto_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

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
          this.setToken(null);
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login?expired=1';
          }
        }
        const error = new Error(data?.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data?.errors;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const netErr = new Error('Unable to connect to server. Please check your connection.');
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
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async register(fullName, email, password, role = 'USER') {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore errors on logout
    } finally {
      this.setToken(null);
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

  // Dashboard endpoints
  async getDashboard() {
    const res = await this.request('/dashboard');
    return res.data;
  }

  // Project endpoints
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
    // Support returning both data array and pagination metadata
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

  // Task endpoints
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

  // User-scoped audit logs
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/audit-logs${qs}`);
    return res;
  }

  // Admin endpoints (RBAC)
  async getAdminAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.action) query.append('action', params.action);
    if (params.entityType) query.append('entityType', params.entityType);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request(`/admin/audit-logs${qs}`);
    return res;
  }

  async getAdminSystemStats() {
    const res = await this.request('/admin/system-stats');
    return res.data;
  }

  // Notification device registration
  async registerPushDevice(token, platform = 'web') {
    const res = await this.request('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
    return res.data;
  }
}

export const api = new ApiClient();
