import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,

  loginAction: async ({ email, password }) => {
    set({ loading: true });
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, loading: false });
    return data.user;
  },

  registerDoctorAction: async (payload) => {
    set({ loading: true });
    const { data } = await api.post('/auth/register/doctor', payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, loading: false });
    return data.user;
  },

  registerPatientAction: async (payload) => {
    set({ loading: true });
    const { data } = await api.post('/auth/register/patient', payload);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, loading: false });
    return data.user;
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      set({ user: null });
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null });
  },
}));
