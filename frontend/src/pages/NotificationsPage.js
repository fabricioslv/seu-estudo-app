
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import '../styles/NotificationsPage.css'; // Criaremos este arquivo de estilo

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const data = await notificationService.getNotifications(user.id, user.token);
          setNotifications(data);
        } catch (error) {
          console.error('Erro ao buscar notificações:', error);
        }
        setLoading(false);
      };

      fetchNotifications();
    }
  }, [user]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(user.id, user.token);
      setNotifications(notifications.map(n => ({ ...n, lida: true })));
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  return (
    <div className="notifications-page-container">
      <div className="notifications-page-header">
        <h1>Notificações</h1>
        <button onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.lida)}>
          Marcar todas como lidas
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="notifications-list-full">
          {notifications.length === 0 ? (
            <li className="notification-item-full">Você não tem notificações.</li>
          ) : (
            notifications.map(n => (
              <li key={n.id} className={`notification-item-full ${n.lida ? 'read' : 'unread'}`}>
                <div className="notification-content-full">
                  <p>{n.conteudo}</p>
                  <span className="notification-time-full">{new Date(n.data_criacao).toLocaleString('pt-BR')}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
