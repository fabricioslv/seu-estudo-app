
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api';

const getMessages = async (userId, token) => {
  const response = await axios.get(`${API_URL}/mensagens/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const sendMessage = async (messageData, token) => {
  const response = await axios.post(`${API_URL}/mensagens`, messageData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const messageService = {
  getMessages,
  sendMessage,
};

export default messageService;
