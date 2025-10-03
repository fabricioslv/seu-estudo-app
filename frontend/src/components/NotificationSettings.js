/**
 * Componente de Configurações de Notificações
 * Permite ao usuário gerenciar notificações push e lembretes de estudo
 */

import React, { useState, useEffect } from 'react';
import pushNotificationService from '../services/pushNotificationService';

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    studyReminders: true,
    progressNotifications: true,
    newContent: true,
    simuladoNotifications: true,
    dailyReminder: true,
    reminderTime: '19:00'
  });

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    setLoading(true);

    try {
      // Verificar suporte
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        // Inicializar serviço
        const initialized = await pushNotificationService.initialize();
        if (initialized) {
          setNotificationsEnabled(pushNotificationService.isEnabled());

          // Carregar configurações salvas
          loadSavedSettings();
        }
      }
    } catch (error) {
      console.error('[NotificationSettings] Erro na inicialização:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSettings = () => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const handleEnableNotifications = async () => {
    setLoading(true);

    try {
      if (notificationsEnabled) {
        // Desabilitar notificações
        const success = await pushNotificationService.unsubscribe();
        if (success) {
          setNotificationsEnabled(false);
          pushNotificationService.disableAutoNotifications();
        }
      } else {
        // Solicitar permissão e habilitar
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const subscription = await pushNotificationService.subscribe();
          if (subscription) {
            setNotificationsEnabled(true);

            // Configurar notificações automáticas se habilitadas
            if (settings.studyReminders) {
              pushNotificationService.setupStudyReminders();
            }
          }
        }
      }
    } catch (error) {
      console.error('[NotificationSettings] Erro ao alterar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = { ...settings, [setting]: value };
    saveSettings(newSettings);

    // Aplicar mudanças imediatas se necessário
    if (setting === 'studyReminders' && value) {
      pushNotificationService.setupStudyReminders();
    } else if (setting === 'studyReminders' && !value) {
      pushNotificationService.disableAutoNotifications();
    }
  };

  const testNotification = async () => {
    if (!notificationsEnabled) return;

    await pushNotificationService.sendNotification({
      title: 'Notificação de teste 📱',
      body: 'As notificações estão funcionando perfeitamente!',
      icon: '/logo192.png',
      tag: 'test-notification'
    });
  };

  if (loading) {
    return (
      <div className="notification-settings">
        <div className="loading">Carregando configurações...</div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="not-supported">
          <span className="icon">📱</span>
          <h3>Notificações não suportadas</h3>
          <p>Seu navegador não oferece suporte para notificações push.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="settings-header">
        <h2>Configurações de Notificações</h2>
        <p>Gerencie como e quando você recebe notificações do Seu-Estudo</p>
      </div>

      {/* Toggle principal de notificações */}
      <div className="setting-group">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Notificações Push</h3>
            <p>Receba notificações mesmo quando o app estiver fechado</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleEnableNotifications}
              disabled={loading}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Configurações detalhadas */}
      {notificationsEnabled && (
        <div className="detailed-settings">
          <div className="settings-section">
            <h4>Lembretes de Estudo</h4>

            <div className="setting-item">
              <div className="setting-info">
                <span>Lembretes diários</span>
                <small>Receba lembretes para manter os estudos em dia</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.studyReminders}
                  onChange={(e) => handleSettingChange('studyReminders', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Horário do lembrete</span>
                <small>Quando você prefere ser lembrado de estudar</small>
              </div>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                className="time-input"
              />
            </div>
          </div>

          <div className="settings-section">
            <h4>Notificações de Progresso</h4>

            <div className="setting-item">
              <div className="setting-info">
                <span>Marcos de progresso</span>
                <small>Comemore quando alcançar 25%, 50%, 75% e 100%</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.progressNotifications}
                  onChange={(e) => handleSettingChange('progressNotifications', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>Conteúdo e Simulados</h4>

            <div className="setting-item">
              <div className="setting-info">
                <span>Novo conteúdo</span>
                <small>Seja notificado quando novo material for adicionado</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.newContent}
                  onChange={(e) => handleSettingChange('newContent', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span>Simulados disponíveis</span>
                <small>Receba notificações sobre novos simulados</small>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.simuladoNotifications}
                  onChange={(e) => handleSettingChange('simuladoNotifications', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h4>Ações</h4>

            <button
              className="test-notification-btn"
              onClick={testNotification}
            >
              🔔 Testar Notificação
            </button>
          </div>
        </div>
      )}

      {/* Status das notificações */}
      <div className="notification-status">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className={`status-value ${notificationsEnabled ? 'enabled' : 'disabled'}`}>
            {notificationsEnabled ? 'Habilitadas' : 'Desabilitadas'}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">Permissão:</span>
          <span className={`status-value ${Notification.permission}`}>
            {Notification.permission === 'granted' && 'Concedida'}
            {Notification.permission === 'denied' && 'Negada'}
            {Notification.permission === 'default' && 'Pendente'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;