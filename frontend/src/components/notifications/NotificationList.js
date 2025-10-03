
import React from 'react';
import { Link } from 'react-router-dom';

const NotificationList = ({ notifications, onMarkAsRead, onClose }) => {

  const handleNotificationClick = (notification) => {
    if (!notification.lida) {
      onMarkAsRead(notification.id);
    }
    // Se houver um link, a navegação será feita pelo componente Link
    // Se não, apenas fecha a lista
    if (!notification.link) {
        onClose();
    }
  };

  return (
    <div className="notification-list-container">
        <div className="notification-header">
            <h3>Notificações</h3>
            <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <ul className="notification-list">
        {notifications.length === 0 ? (
            <li className="notification-item">Nenhuma notificação nova.</li>
        ) : (
            notifications.map(n => (
            <li key={n.id} className={`notification-item ${n.lida ? 'read' : 'unread'}`}>
                <Link to={n.link || '#'} onClick={() => handleNotificationClick(n)} className="notification-link">
                    <p className="notification-content">{n.conteudo}</p>
                    <span className="notification-time">{new Date(n.data_criacao).toLocaleString('pt-BR')}</span>
                </Link>
            </li>
            ))
        )}
        </ul>
        <div className="notification-footer">
            <Link to="/notificacoes" onClick={onClose}>Ver todas</Link>
        </div>
    </div>
  );
};

export default NotificationList;
