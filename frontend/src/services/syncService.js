/**
 * Serviço de Sincronização Automática para Seu-Estudo PWA
 * Responsável por sincronizar dados entre modo offline e online
 */

import offlineService from './offlineService.js';

class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
    this.syncStrategies = {
      respostas: 'immediate',
      progresso: 'batched',
      notas: 'immediate',
      questoes: 'background',
      livros: 'background'
    };

    this.conflictResolvers = {
      respostas: this.resolveRespostaConflict.bind(this),
      progresso: this.resolveProgressoConflict.bind(this),
      notas: this.resolveNotaConflict.bind(this)
    };

    this.initializeSync();
  }

  /**
   * Inicializar serviço de sincronização
   */
  initializeSync() {
    // Registrar Service Worker se disponível
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Iniciar sincronização automática quando online
    if (offlineService.isOnlineMode()) {
      this.startAutoSync();
    }

    // Listener para mudanças de conexão
    window.addEventListener('connectionChange', (event) => {
      if (event.detail.online) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    });

    // Listener para visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && offlineService.isOnlineMode()) {
        this.performSmartSync();
      }
    });
  }

  /**
   * Registrar Service Worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SyncService] Service Worker registrado');

      // Configurar canal de comunicação
      this.setupServiceWorkerCommunication(registration);

    } catch (error) {
      console.error('[SyncService] Erro ao registrar Service Worker:', error);
    }
  }

  /**
   * Configurar comunicação com Service Worker
   */
  setupServiceWorkerCommunication(registration) {
    // Canal para mensagens
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Configurar sincronização em background
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync(registration);
    }
  }

  /**
   * Configurar sincronização em background
   */
  setupBackgroundSync(registration) {
    registration.sync.register('background-sync').then(() => {
      console.log('[SyncService] Background sync registrado');
    }).catch((error) => {
      console.error('[SyncService] Erro no background sync:', error);
    });
  }

  /**
   * Iniciar sincronização automática
   */
  startAutoSync() {
    if (this.syncInterval) return;

    // Sincronização imediata
    this.performSmartSync();

    // Sincronização periódica (a cada 5 minutos)
    this.syncInterval = setInterval(() => {
      this.performSmartSync();
    }, 5 * 60 * 1000);

    console.log('[SyncService] Auto-sync iniciado');
  }

  /**
   * Parar sincronização automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SyncService] Auto-sync parado');
    }
  }

  /**
   * Sincronização inteligente baseada no contexto
   */
  async performSmartSync() {
    if (this.isSyncing || !offlineService.isOnlineMode()) return;

    this.isSyncing = true;

    try {
      console.log('[SyncService] Iniciando sincronização inteligente');

      // 1. Sincronizar respostas críticas (immediate)
      await this.syncCriticalData();

      // 2. Sincronizar progresso (batched)
      await this.syncProgressData();

      // 3. Buscar atualizações (background)
      await this.fetchUpdates();

      // 4. Resolver conflitos
      await this.resolveConflicts();

      // 5. Limpar dados antigos
      await this.cleanupOldData();

      console.log('[SyncService] Sincronização concluída');

      // Atualizar timestamp da última sincronização
      localStorage.setItem('lastSync', new Date().toISOString());

    } catch (error) {
      console.error('[SyncService] Erro durante sincronização:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincronizar dados críticos (respostas, notas)
   */
  async syncCriticalData() {
    const pendingResponses = await offlineService.getPendingResponses?.() || [];
    const pendingNotes = await offlineService.getPendingNotes?.() || [];

    const criticalItems = [
      ...pendingResponses.map(r => ({ type: 'resposta', data: r })),
      ...pendingNotes.map(n => ({ type: 'nota', data: n }))
    ];

    for (const item of criticalItems) {
      try {
        await this.syncItem(item.type, item.data);
      } catch (error) {
        console.error(`[SyncService] Erro ao sincronizar ${item.type}:`, error);
      }
    }
  }

  /**
   * Sincronizar dados de progresso
   */
  async syncProgressData() {
    const progresso = await offlineService.getProgressoOffline();

    if (progresso.length > 0) {
      try {
        await this.syncItem('progresso', progresso);
      } catch (error) {
        console.error('[SyncService] Erro ao sincronizar progresso:', error);
      }
    }
  }

  /**
   * Buscar atualizações do servidor
   */
  async fetchUpdates() {
    try {
      // Buscar questões atualizadas
      const questoesResponse = await fetch('/api/questoes/atualizacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${offlineService.getAuthToken()}`
        },
        body: JSON.stringify({
          lastSync: localStorage.getItem('lastSync'),
          userId: offlineService.getCurrentUser()?.id
        })
      });

      if (questoesResponse.ok) {
        const questoes = await questoesResponse.json();
        await offlineService.storeQuestoesOffline(questoes);
      }

      // Buscar livros atualizados
      const livrosResponse = await fetch('/api/livros/atualizacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${offlineService.getAuthToken()}`
        },
        body: JSON.stringify({
          lastSync: localStorage.getItem('lastSync')
        })
      });

      if (livrosResponse.ok) {
        const livros = await livrosResponse.json();
        for (const livro of livros) {
          await offlineService.storeLivroOffline(livro);
        }
      }

    } catch (error) {
      console.error('[SyncService] Erro ao buscar atualizações:', error);
    }
  }

  /**
   * Resolver conflitos de dados
   */
  async resolveConflicts() {
    // Implementar resolução de conflitos baseada em timestamp
    const conflicts = await this.detectConflicts();

    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict);
      } catch (error) {
        console.error('[SyncService] Erro ao resolver conflito:', error);
      }
    }
  }

  /**
   * Detectar conflitos de dados
   */
  async detectConflicts() {
    const conflicts = [];

    // Verificar conflitos em respostas
    const localResponses = await offlineService.getPendingResponses?.() || [];
    for (const response of localResponses) {
      try {
        const serverResponse = await fetch(`/api/respostas/${response.id}`);
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          if (serverData.timestamp !== response.timestamp) {
            conflicts.push({
              type: 'resposta',
              local: response,
              server: serverData
            });
          }
        }
      } catch (error) {
        // Ignorar erros de rede
      }
    }

    return conflicts;
  }

  /**
   * Resolver conflito específico
   */
  async resolveConflict(conflict) {
    const resolver = this.conflictResolvers[conflict.type];
    if (resolver) {
      return await resolver(conflict.local, conflict.server);
    }

    // Resolução padrão: usar dados mais recentes
    const localTime = new Date(conflict.local.timestamp);
    const serverTime = new Date(conflict.server.timestamp);

    const winner = localTime > serverTime ? conflict.local : conflict.server;

    if (winner === conflict.local) {
      await this.syncItem(conflict.type, conflict.local);
    }
  }

  /**
   * Resolver conflito de resposta
   */
  async resolveRespostaConflict(local, server) {
    // Para respostas, geralmente manter a mais recente
    const localTime = new Date(local.timestamp);
    const serverTime = new Date(server.timestamp);

    if (localTime > serverTime) {
      return await this.syncItem('resposta', local);
    } else {
      // Atualizar dados locais com versão do servidor
      await offlineService.updateRespostaLocal(server);
    }
  }

  /**
   * Resolver conflito de progresso
   */
  async resolveProgressoConflict(local, server) {
    // Para progresso, mesclar dados quando possível
    const merged = { ...server };

    // Manter valores mais altos de cada lado
    Object.keys(local).forEach(key => {
      if (typeof local[key] === 'number' && typeof server[key] === 'number') {
        merged[key] = Math.max(local[key], server[key]);
      }
    });

    return await this.syncItem('progresso', merged);
  }

  /**
   * Resolver conflito de nota
   */
  async resolveNotaConflict(local, server) {
    // Para notas, manter ambas se diferentes
    if (local.content !== server.content) {
      // Criar nova nota com conteúdo mesclado
      const mergedNote = {
        ...server,
        content: `Nota original: ${server.content}\n\nAtualização local: ${local.content}`,
        merged: true
      };

      return await this.syncItem('nota', mergedNote);
    }

    // Se conteúdo igual, usar a mais recente
    const localTime = new Date(local.timestamp);
    const serverTime = new Date(server.timestamp);

    return localTime > serverTime ?
      await this.syncItem('nota', local) :
      await this.syncItem('nota', server);
  }

  /**
   * Sincronizar item específico
   */
  async syncItem(type, data) {
    const endpoint = this.getEndpointForType(type);
    const method = data.id ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${offlineService.getAuthToken()}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Erro ao sincronizar ${type}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obter endpoint baseado no tipo
   */
  getEndpointForType(type) {
    const endpoints = {
      resposta: '/api/respostas',
      progresso: '/api/progresso',
      nota: '/api/notas',
      questao: '/api/questoes',
      livro: '/api/livros'
    };

    return endpoints[type] || '/api/sync';
  }

  /**
   * Limpar dados antigos
   */
  async cleanupOldData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Limpar respostas antigas
    await offlineService.cleanupOldResponses?.(thirtyDaysAgo);

    // Limpar logs antigos
    const oldLogs = localStorage.getItem('syncLogs');
    if (oldLogs) {
      const logs = JSON.parse(oldLogs);
      const recentLogs = logs.filter(log =>
        new Date(log.timestamp) > thirtyDaysAgo
      );
      localStorage.setItem('syncLogs', JSON.stringify(recentLogs));
    }
  }

  /**
   * Forçar sincronização completa
   */
  async forceFullSync() {
    this.isSyncing = true;

    try {
      console.log('[SyncService] Iniciando sincronização completa');

      // Buscar todos os dados atualizados
      await this.fetchAllData();

      // Enviar todos os dados locais
      await this.sendAllLocalData();

      // Resolver conflitos
      await this.resolveConflicts();

      console.log('[SyncService] Sincronização completa finalizada');

    } catch (error) {
      console.error('[SyncService] Erro na sincronização completa:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Buscar todos os dados do servidor
   */
  async fetchAllData() {
    try {
      // Buscar questões
      const questoesResponse = await fetch('/api/questoes?sync=all', {
        headers: { 'Authorization': `Bearer ${offlineService.getAuthToken()}` }
      });

      if (questoesResponse.ok) {
        const questoes = await questoesResponse.json();
        await offlineService.storeQuestoesOffline(questoes);
      }

      // Buscar livros
      const livrosResponse = await fetch('/api/livros?sync=all', {
        headers: { 'Authorization': `Bearer ${offlineService.getAuthToken()}` }
      });

      if (livrosResponse.ok) {
        const livros = await livrosResponse.json();
        for (const livro of livros) {
          await offlineService.storeLivroOffline(livro);
        }
      }

    } catch (error) {
      console.error('[SyncService] Erro ao buscar todos os dados:', error);
    }
  }

  /**
   * Enviar todos os dados locais
   */
  async sendAllLocalData() {
    // Implementar envio de dados locais pendentes
    const pendingData = offlineService.syncQueue;

    for (const item of pendingData) {
      try {
        await this.syncItem(item.type, item.data);
      } catch (error) {
        console.error(`[SyncService] Erro ao enviar ${item.type}:`, error);
      }
    }
  }

  /**
   * Obter status da sincronização
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSync: localStorage.getItem('lastSync'),
      pendingItems: offlineService.syncQueue.length,
      connectionStatus: offlineService.getConnectionStatus()
    };
  }

  /**
   * Manipular mensagens do Service Worker
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'SYNC_REQUEST':
        this.performSmartSync();
        break;
      case 'BACKGROUND_SYNC_COMPLETED':
        console.log('[SyncService] Background sync concluído');
        break;
      default:
        console.log('[SyncService] Mensagem SW não reconhecida:', data.type);
    }
  }

  /**
   * Adicionar listener personalizado
   */
  addEventListener(event, callback) {
    window.addEventListener(`syncService_${event}`, callback);
  }

  /**
   * Emitir evento personalizado
   */
  emitEvent(event, data) {
    window.dispatchEvent(new CustomEvent(`syncService_${event}`, { detail: data }));
  }
}

// Criar instância singleton
const syncService = new SyncService();

// Tornar disponível globalmente
window.syncService = syncService;

export default syncService;