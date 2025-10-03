/**
 * Inicialização PWA - Seu-Estudo
 * Configura funcionalidades PWA, Service Worker e inicialização offline
 */

import offlineService from './offlineService';
import syncService from './syncService';
import pushNotificationService from './pushNotificationService';

// Configuração inicial do PWA
class PWAInitializer {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Inicializar todas as funcionalidades PWA
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('[PWAInitializer] Inicializando PWA...');

    try {
      // 1. Registrar Service Worker
      await this.registerServiceWorker();

      // 2. Inicializar serviços offline
      await this.initializeOfflineServices();

      // 3. Configurar notificações push
      await this.initializePushNotifications();

      // 4. Configurar eventos PWA
      this.setupPWAEvents();

      // 5. Verificar instalação como app
      this.checkInstallPrompt();

      this.isInitialized = true;
      console.log('[PWAInitializer] PWA inicializado com sucesso');

    } catch (error) {
      console.error('[PWAInitializer] Erro na inicialização PWA:', error);
    }
  }

  /**
   * Registrar Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWAInitializer] Service Worker não suportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWAInitializer] Service Worker registrado:', registration.scope);

      // Aguardar Service Worker ficar pronto
      await navigator.serviceWorker.ready;

      // Configurar comunicação
      this.setupServiceWorkerCommunication(registration);

    } catch (error) {
      console.error('[PWAInitializer] Erro ao registrar Service Worker:', error);
    }
  }

  /**
   * Configurar comunicação com Service Worker
   */
  setupServiceWorkerCommunication(registration) {
    const messageChannel = new MessageChannel();

    // Canal para mensagens bidirecionais
    navigator.serviceWorker.controller?.postMessage({
      type: 'PWA_READY',
      data: { timestamp: Date.now() }
    }, [messageChannel.port2]);

    // Listener para mensagens do SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  /**
   * Inicializar serviços offline
   */
  async initializeOfflineServices() {
    try {
      // Inicializar offline service
      if (offlineService) {
        console.log('[PWAInitializer] OfflineService inicializado');
      }

      // Inicializar sync service
      if (syncService) {
        console.log('[PWAInitializer] SyncService inicializado');
      }

    } catch (error) {
      console.error('[PWAInitializer] Erro ao inicializar serviços offline:', error);
    }
  }

  /**
   * Inicializar notificações push
   */
  async initializePushNotifications() {
    try {
      // Configurar chave VAPID pública (vem do backend)
      const vapidKey = await this.getVapidPublicKey();

      if (vapidKey && pushNotificationService) {
        pushNotificationService.setVapidPublicKey(vapidKey);
        await pushNotificationService.initialize();
        console.log('[PWAInitializer] Push notifications inicializadas');
      }

    } catch (error) {
      console.error('[PWAInitializer] Erro ao inicializar push notifications:', error);
    }
  }

  /**
   * Obter chave VAPID pública do backend
   */
  async getVapidPublicKey() {
    try {
      const response = await fetch('/api/notifications/vapid-key');
      if (response.ok) {
        const data = await response.json();
        return data.vapidPublicKey;
      }
    } catch (error) {
      console.warn('[PWAInitializer] Não foi possível obter chave VAPID:', error);
    }

    // Chave padrão para desenvolvimento
    return 'BKxQAK1qKJpUtJ2hKJqUtJ2hKJqUtJ2hKJqUtJ2hKJqUtJ2hKJqUtJ2h';
  }

  /**
   * Configurar eventos PWA
   */
  setupPWAEvents() {
    // Evento de instalação do app
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[PWAInitializer] App pode ser instalado');
      this.handleInstallPrompt(event);
    });

    // Evento de instalação concluída
    window.addEventListener('appinstalled', () => {
      console.log('[PWAInitializer] App instalado com sucesso');
      this.onAppInstalled();
    });

    // Evento de visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.onAppVisible();
      }
    });

    // Evento de conexão online/offline
    window.addEventListener('online', () => {
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.onOffline();
    });
  }

  /**
   * Manipular prompt de instalação
   */
  handleInstallPrompt(event) {
    // Salvar evento para uso posterior
    window.deferredInstallPrompt = event;

    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('pwa:install-available', {
      detail: { prompt: event }
    }));
  }

  /**
   * Quando app é instalado
   */
  onAppInstalled() {
    // Remover deferred prompt
    delete window.deferredInstallPrompt;

    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('pwa:app-installed'));

    // Mostrar notificação de sucesso
    this.showInstallSuccessNotification();
  }

  /**
   * Quando app volta a ser visível
   */
  onAppVisible() {
    // Sincronizar dados se necessário
    if (offlineService.isOnlineMode()) {
      syncService.performSmartSync();
    }
  }

  /**
   * Quando volta online
   */
  onOnline() {
    console.log('[PWAInitializer] Conexão restabelecida');

    // Sincronizar dados
    setTimeout(() => {
      syncService.performSmartSync();
    }, 1000);

    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('pwa:online'));
  }

  /**
   * Quando fica offline
   */
  onOffline() {
    console.log('[PWAInitializer] Modo offline ativado');

    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('pwa:offline'));
  }

  /**
   * Verificar prompt de instalação
   */
  checkInstallPrompt() {
    // Verificar se app já está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWAInitializer] App já está instalado');
      window.dispatchEvent(new CustomEvent('pwa:already-installed'));
    }
  }

  /**
   * Exibir notificação de instalação bem-sucedida
   */
  showInstallSuccessNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Seu-Estudo Instalado! 🎉', {
        body: 'O app foi instalado com sucesso. Você pode acessá-lo diretamente da tela inicial.',
        icon: '/logo192.png',
        tag: 'install-success',
        requireInteraction: false
      });

      setTimeout(() => notification.close(), 5000);
    }
  }

  /**
   * Manipular mensagens do Service Worker
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'OFFLINE_DATA_UPDATED':
        console.log('[PWAInitializer] Dados offline atualizados');
        window.dispatchEvent(new CustomEvent('pwa:offline-data-updated', {
          detail: data
        }));
        break;

      case 'SYNC_COMPLETED':
        console.log('[PWAInitializer] Sincronização concluída');
        window.dispatchEvent(new CustomEvent('pwa:sync-completed', {
          detail: data
        }));
        break;

      default:
        console.log('[PWAInitializer] Mensagem SW não reconhecida:', data.type);
    }
  }

  /**
   * Obter status do PWA
   */
  getPWAStatus() {
    return {
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isOnline: navigator.onLine,
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      notifications: 'Notification' in window,
      canInstall: !!window.deferredInstallPrompt
    };
  }

  /**
   * Instalar app manualmente
   */
  async installApp() {
    if (window.deferredInstallPrompt) {
      try {
        window.deferredInstallPrompt.prompt();
        const { outcome } = await window.deferredInstallPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('[PWAInitializer] App instalado pelo usuário');
          delete window.deferredInstallPrompt;
          return true;
        } else {
          console.log('[PWAInitializer] Instalação cancelada pelo usuário');
          return false;
        }
      } catch (error) {
        console.error('[PWAInitializer] Erro na instalação:', error);
        return false;
      }
    }

    return false;
  }
}

// Criar instância global
const pwaInitializer = new PWAInitializer();

// Inicializar automaticamente quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaInitializer.initialize();
  });
} else {
  pwaInitializer.initialize();
}

// Tornar disponível globalmente
window.pwaInitializer = pwaInitializer;
window.installPWA = () => pwaInitializer.installApp();

export default pwaInitializer;