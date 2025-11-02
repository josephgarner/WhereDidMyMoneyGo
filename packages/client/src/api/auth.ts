import { apiClient } from './client';
import { User, ApiResponse } from '@finances/shared';

export const authApi = {
  async getLoginUrl(): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ url: string }>>('/auth/login');
    return response.data.data?.url || '';
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
