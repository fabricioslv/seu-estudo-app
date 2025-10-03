
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api';

const getNotifications = async (userId, token) => {
  const response = await axios.get(`${API_URL}/notificacoes/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const markAsRead = async (notificationId, token) => {
  const response = await axios.put(`${API_URL}/notificacoes/${notificationId}/lida`, {},
  {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const markAllAsRead = async (userId, token) => {
  const response = await axios.put(`${API_URL}/notificacoes/usuario/${userId}/lidas`, {},
  {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationService;
