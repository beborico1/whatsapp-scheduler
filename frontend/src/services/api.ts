import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-f5270.up.railway.app/api';

// Debug log to see what URL is being used
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to log all requests
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('Config:', JSON.stringify({
      method: config.method,
      baseURL: config.baseURL,
      url: config.url,
      headers: config.headers
    }, null, 2));
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Message {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface Recipient {
  id: number;
  name: string;
  phone_number: string;
  created_at: string;
}

export interface RecipientGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  recipients?: Recipient[];
}

export interface ScheduledMessage {
  id: number;
  message_id: number;
  group_id: number;
  scheduled_time: string;
  status: string;
  task_id?: string;
  error_message?: string;
  created_at: string;
  sent_at?: string;
  message: Message;
  group: RecipientGroup;
}

export const messageApi = {
  getAll: () => api.get<Message[]>('/messages'),
  getOne: (id: number) => api.get<Message>(`/messages/${id}`),
  create: (data: { title: string; content: string }) => api.post<Message>('/messages', data),
  update: (id: number, data: { title: string; content: string }) => api.put<Message>(`/messages/${id}`, data),
  delete: (id: number) => api.delete(`/messages/${id}`),
};

export const recipientApi = {
  getAll: () => api.get<Recipient[]>('/recipients'),
  getOne: (id: number) => api.get<Recipient>(`/recipients/${id}`),
  create: (data: { name: string; phone_number: string; group_ids?: number[] }) => api.post<Recipient>('/recipients', data),
  delete: (id: number) => api.delete(`/recipients/${id}`),
};

export const groupApi = {
  getAll: () => api.get<RecipientGroup[]>('/recipients/groups'),
  getOne: (id: number) => api.get<RecipientGroup>(`/recipients/groups/${id}`),
  create: (data: { name: string; description?: string; recipient_ids?: number[] }) => api.post<RecipientGroup>('/recipients/groups', data),
  updateRecipients: (id: number, recipientIds: number[]) => api.put<RecipientGroup>(`/recipients/groups/${id}/recipients`, recipientIds),
  delete: (id: number) => api.delete(`/recipients/groups/${id}`),
};

export const scheduleApi = {
  getAll: (status?: string) => api.get<ScheduledMessage[]>('/schedules', { params: { status } }),
  getOne: (id: number) => api.get<ScheduledMessage>(`/schedules/${id}`),
  create: (data: { message_id: number; group_id: number; scheduled_time: string }) => api.post<ScheduledMessage>('/schedules', data),
  cancel: (id: number) => api.put(`/schedules/${id}/cancel`),
  sendNow: (id: number) => api.post(`/schedules/${id}/send-now`),
  delete: (id: number) => api.delete(`/schedules/${id}`),
};

export default api;