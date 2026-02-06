import axios from 'axios';
import { API_URL } from '../config/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export interface Resource {
  _id: string;
  title: string;
  description: string;
  link: string;
  icon: string;
  color: string;
  bgColor: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

class ResourceService {
  // Get all active resources
  async getActiveResources(): Promise<Resource[]> {
    try {
      const response = await axios.get(`${API_URL}/resources`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch resources');
    }
  }

  // Get all resources (admin only)
  async getAllResources(): Promise<Resource[]> {
    try {
      const response = await axios.get(`${API_URL}/resources/admin`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all resources');
    }
  }

  // Create new resource (admin only)
  async createResource(resourceData: Partial<Resource>): Promise<Resource> {
    try {
      const response = await axios.post(`${API_URL}/resources`, resourceData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create resource');
    }
  }

  // Update resource (admin only)
  async updateResource(id: string, resourceData: Partial<Resource>): Promise<Resource> {
    try {
      const response = await axios.put(`${API_URL}/resources/${id}`, resourceData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update resource');
    }
  }

  // Delete resource (admin only)
  async deleteResource(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/resources/${id}`, {
        headers: getAuthHeaders()
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete resource');
    }
  }

  // Toggle resource active status (admin only)
  async toggleResource(id: string): Promise<Resource> {
    try {
      const response = await axios.patch(`${API_URL}/resources/${id}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to toggle resource');
    }
  }
}

export const resourceService = new ResourceService();
