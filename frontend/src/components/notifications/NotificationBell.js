
import React, { useState, useEffect, useContext } from 'react';
import { FaBell } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import NotificationList from './NotificationList';
import './Notifications.css';

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.lida).length;

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const data = await notificationService.getNotifications(user.id, user.token);
          setNotifications(data);
        } catch (error) {
          console.error('Erro ao buscar notificações:', error);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Atualiza a cada minuto

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id, user.token);
      setNotifications(notifications.map(n => n.id === id ? { ...n, lida: true } : n));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  return (
    <div className="notification-bell">
      <FaBell onClick={handleToggle} size={20} />
      {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      {isOpen && 
        <NotificationList 
          notifications={notifications} 
          onMarkAsRead={handleMarkAsRead} 
          onClose={() => setIsOpen(false)}
        />
      }
    </div>
  );
};

export default NotificationBell;
