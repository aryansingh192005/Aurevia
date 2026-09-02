import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
});

export async function getHealth() {
  const response = await api.get('/health');
  return response.data;
}

export default api;