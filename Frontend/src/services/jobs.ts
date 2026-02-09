import { api } from './api';

export const jobService = {
  getJobs: async (params?: any) => {
    const response = await api.get('/api/jobs', { params });
    return response.data?.data || response.data;
  },

  getJob: async (id: string) => {
    const response = await api.get(`/api/jobs/${id}`);
    return response.data?.data || response.data;
  },

  createJob: async (payload: any) => {
    const response = await api.post('/api/jobs', payload);
    return response.data?.data || response.data;
  },

  applyToJob: async (id: string, payload: { resumeUrl?: string; coverLetter?: string }) => {
    const response = await api.post(`/api/jobs/${id}/apply`, payload);
    return response.data?.data || response.data;
  }
};

export default jobService;
