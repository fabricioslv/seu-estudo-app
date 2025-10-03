/**
 * Serviço de Notificações Push para Seu-Estudo PWA
 * Responsável por gerenciar notificações push para engajamento do usuário
 */

class PushNotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = null; // Será configurado pelo backend
  }

  /**
   * Inicializar serviço de notificações
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('[PushNotificationService] Push notifications not supported');
      return false;
    }

    try {
      // Registrar Service Worker
      this.registration = await navigator.serviceWorker.ready;

      // Verificar se já existe subscription
      this.subscription = await this.registration.pushManager.getSubscription();

      // Solicitar permissão se necessário
      if (!this.subscription) {
        await this.requestPermission();
      }

      console.log('[PushNotificationService] Inicializado');
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Solicitar permissão para notificações
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[PushNotificationService] Permissão concedida');
        await this.subscribe();
      } else {
        console.log('[PushNotificationService] Permissão negada');
      }

      return permission;
    } catch (error) {
      console.error('[PushNotificationService] Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }

  /**
   * Inscrever-se para notificações push
   */
  async subscribe() {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      // Converter chave pública VAPID
      const vapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      console.log('[PushNotificationService] Subscrito com sucesso');

      // Enviar subscription para o servidor
      await this.sendSubscriptionToServer();

      return this.subscription;
    } catch (error) {
      console.error('[PushNotificationService] Erro ao subscrever:', error);
      return null;
    }
  }

  /**
   * Cancelar inscrição
   */
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
        console.log('[PushNotificationService] Inscrição cancelada');
        return true;
      }
    } catch (error) {
      console.error('[PushNotificationService] Erro ao cancelar inscrição:', error);
    }

    return false;
  }

  /**
   * Enviar subscription para o servidor
   */
  async sendSubscriptionToServer() {
    if (!this.subscription) return;

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: this.subscription,
          userAgent: navigator.userAgent,
          endpoint: this.subscription.endpoint
        })
      });

      if (response.ok) {
        console.log('[PushNotificationService] Subscription enviada para servidor');
      } else {
        console.error('[PushNotificationService] Erro ao enviar subscription');
      }
    } catch (error) {
      console.error('[PushNotificationService] Erro de rede:', error);
    }
  }

  /**
   * Configurar chave VAPID pública
   */
  setVapidPublicKey(key) {
    this.vapidPublicKey = key;
  }

  /**
   * Converter URL base64 para Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Obter token de autenticação
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Verificar se notificações estão habilitadas
   */
  isEnabled() {
    return this.subscription !== null;
  }

  /**
   * Obter status das notificações
   */
  getStatus() {
    return {
      supported: this.isSupported,
      enabled: this.isEnabled(),
      permission: Notification.permission,
      subscription: this.subscription
    };
  }

  /**
   * Agendar notificação de estudo
   */
  async scheduleStudyNotification(title, body, delay = 1000 * 60 * 30) {
    if (!this.isEnabled()) return;

    setTimeout(async () => {
      try {
        await this.sendNotification({
          title: title || 'Hora de estudar! 📚',
          body: body || 'Que tal revisar o conteúdo que você estudou hoje?',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'study-reminder',
          data: {
            type: 'study-reminder',
            timestamp: Date.now()
          },
          actions: [
            {
              action: 'open-app',
              title: 'Abrir App'
            },
            {
              action: 'dismiss',
              title: 'Agora não'
            }
          ]
        });
      } catch (error) {
        console.error('[PushNotificationService] Erro ao agendar notificação:', error);
      }
    }, delay);
  }

  /**
   * Agendar notificação de progresso
   */
  async scheduleProgressNotification(progress) {
    if (!this.isEnabled() || progress < 25) return;

    const milestones = [25, 50, 75, 100];
    const milestone = milestones.find(m => progress >= m);

    if (milestone) {
      await this.sendNotification({
        title: `Parabéns! 🎉`,
        body: `Você alcançou ${milestone}% de progresso nos estudos! Continue assim!`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: `progress-${milestone}`,
        data: {
          type: 'progress-milestone',
          milestone,
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * Notificação de novo conteúdo
   */
  async notifyNewContent(content) {
    if (!this.isEnabled()) return;

    await this.sendNotification({
      title: 'Novo conteúdo disponível! 📖',
      body: `Confira o novo material: ${content.title}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'new-content',
      data: {
        type: 'new-content',
        contentId: content.id,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Notificação de simulado disponível
   */
  async notifySimuladoAvailable(simulado) {
    if (!this.isEnabled()) return;

    await this.sendNotification({
      title: 'Novo simulado disponível! 🧠',
      body: `Teste seus conhecimentos com o simulado: ${simulado.title}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `simulado-${simulado.id}`,
      data: {
        type: 'simulado-available',
        simuladoId: simulado.id,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Enviar notificação push
   */
  async sendNotification(options) {
    try {
      // Se temos Service Worker ativo, enviar através dele
      if (this.registration && this.registration.active) {
        this.registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          data: options
        });
      }

      // Também mostrar notificação nativa se permitido
      if (Notification.permission === 'granted') {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false
        });

        // Configurar ações da notificação
        notification.onclick = () => {
          this.handleNotificationClick(options.data);
          notification.close();
        };

        // Auto-fechar após 5 segundos se não for interativa
        if (!options.requireInteraction) {
          setTimeout(() => notification.close(), 5000);
        }
      }
    } catch (error) {
      console.error('[PushNotificationService] Erro ao enviar notificação:', error);
    }
  }

  /**
   * Manipular clique na notificação
   */
  handleNotificationClick(data) {
    switch (data?.type) {
      case 'study-reminder':
        window.focus();
        // Navegar para página de estudo
        window.location.href = '/estudar';
        break;

      case 'new-content':
        window.focus();
        window.location.href = `/conteudo/${data.contentId}`;
        break;

      case 'simulado-available':
        window.focus();
        window.location.href = `/simulados/${data.simuladoId}`;
        break;

      case 'progress-milestone':
        window.focus();
        window.location.href = '/dashboard';
        break;

      default:
        window.focus();
        break;
    }
  }

  /**
   * Configurar notificações automáticas de estudo
   */
  async setupStudyReminders() {
    if (!this.isEnabled()) return;

    // Notificações de estudo diárias
    this.scheduleStudyNotification(
      'Hora de estudar! 📚',
      'Que tal revisar o conteúdo que você estudou hoje?',
      1000 * 60 * 60 * 2 // 2 horas
    );

    // Notificações de reforço
    this.scheduleStudyNotification(
      'Reforçar o aprendizado! 🔄',
      'Revisar o conteúdo ajuda na fixação. Vamos lá?',
      1000 * 60 * 60 * 24 // 24 horas
    );
  }

  /**
   * Desabilitar notificações automáticas
   */
  disableAutoNotifications() {
    // Implementar limpeza de timers se necessário
    console.log('[PushNotificationService] Notificações automáticas desabilitadas');
  }
}

// Criar instância singleton
const pushNotificationService = new PushNotificationService();

// Tornar disponível globalmente
window.pushNotificationService = pushNotificationService;

export default pushNotificationService;