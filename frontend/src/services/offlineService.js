/**
 * Serviço de Gerenciamento Offline para Seu-Estudo PWA
 * Responsável por detectar conexão, gerenciar dados locais e funcionalidades offline
 */

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.dbName = 'SeuEstudoOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.syncQueue = [];

    this.initializeEventListeners();
    this.initializeIndexedDB();
  }

  /**
   * Inicializar event listeners para detectar mudanças de conexão
   */
  initializeEventListeners() {
    window.addEventListener('online', () => {
      console.log('[OfflineService] Conexão restabelecida');
      this.isOnline = true;
      this.onConnectionChange(true);
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineService] Conexão perdida');
      this.isOnline = false;
      this.onConnectionChange(false);
    });

    // Listener para Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }

  /**
   * Inicializar IndexedDB para armazenamento offline
   */
  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[OfflineService] Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineService] IndexedDB inicializado');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para questões offline
        if (!db.objectStoreNames.contains('questoes')) {
          const questoesStore = db.createObjectStore('questoes', { keyPath: 'id' });
          questoesStore.createIndex('materia', 'materia', { unique: false });
          questoesStore.createIndex('assunto', 'assunto', { unique: false });
          questoesStore.createIndex('nivel', 'nivel', { unique: false });
        }

        // Store para progresso do usuário
        if (!db.objectStoreNames.contains('progresso')) {
          const progressoStore = db.createObjectStore('progresso', { keyPath: 'id' });
          progressoStore.createIndex('usuario', 'usuario', { unique: false });
          progressoStore.createIndex('tipo', 'tipo', { unique: false });
        }

        // Store para respostas offline
        if (!db.objectStoreNames.contains('respostas')) {
          const respostasStore = db.createObjectStore('respostas', { keyPath: 'id', autoIncrement: true });
          respostasStore.createIndex('simulado', 'simulado', { unique: false });
          respostasStore.createIndex('questao', 'questao', { unique: false });
          respostasStore.createIndex('usuario', 'usuario', { unique: false });
          respostasStore.createIndex('pendente', 'pendente', { unique: false });
        }

        // Store para livros didáticos
        if (!db.objectStoreNames.contains('livros')) {
          const livrosStore = db.createObjectStore('livros', { keyPath: 'id' });
          livrosStore.createIndex('categoria', 'categoria', { unique: false });
          livrosStore.createIndex('nivel', 'nivel', { unique: false });
        }

        // Store para notas e destaques
        if (!db.objectStoreNames.contains('notas')) {
          const notasStore = db.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
          notasStore.createIndex('usuario', 'usuario', { unique: false });
          notasStore.createIndex('tipo', 'tipo', { unique: false });
          notasStore.createIndex('referencia', 'referencia', { unique: false });
        }

        // Store para configurações offline
        if (!db.objectStoreNames.contains('configuracoes')) {
          db.createObjectStore('configuracoes', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Manipular mensagens do Service Worker
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETED':
        console.log('[OfflineService] Sincronização concluída');
        this.onSyncCompleted(data);
        break;
      case 'DATA_UPDATED':
        console.log('[OfflineService] Dados atualizados offline');
        this.onDataUpdated(data);
        break;
      default:
        console.log('[OfflineService] Mensagem SW não reconhecida:', type);
    }
  }

  /**
   * Verificar se está online
   */
  isOnlineMode() {
    return this.isOnline;
  }

  /**
   * Obter status da conexão
   */
  getConnectionStatus() {
    return {
      online: this.isOnline,
      since: this.lastConnectionChange || new Date(),
      type: this.getConnectionType()
    };
  }

  /**
   * Obter tipo de conexão
   */
  getConnectionType() {
    if (!navigator.connection) return 'unknown';

    const connection = navigator.connection;
    if (connection.effectiveType) {
      return connection.effectiveType;
    }

    return 'unknown';
  }

  /**
   * Callback para mudança de conexão
   */
  onConnectionChange(online) {
    // Emitir evento personalizado
    window.dispatchEvent(new CustomEvent('connectionChange', {
      detail: { online }
    }));

    // Notificar componentes
    if (online) {
      this.showNotification('Conexão restabelecida! Sincronizando dados...', 'success');
    } else {
      this.showNotification('Modo offline ativado. Você pode continuar estudando.', 'info');
    }
  }

  /**
   * Armazenar questões para uso offline
   */
  async storeQuestoesOffline(questoes) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['questoes'], 'readwrite');
      const store = transaction.objectStore('questoes');

      questoes.forEach(questao => {
        store.put(questao);
      });

      transaction.oncomplete = () => {
        console.log(`[OfflineService] ${questoes.length} questões armazenadas offline`);
        resolve();
      };

      transaction.onerror = () => {
        console.error('[OfflineService] Erro ao armazenar questões:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Buscar questões offline
   */
  async getQuestoesOffline(filters = {}) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['questoes'], 'readonly');
      const store = transaction.objectStore('questoes');
      const request = store.getAll();

      request.onsuccess = () => {
        let questoes = request.result;

        // Aplicar filtros
        if (filters.materia) {
          questoes = questoes.filter(q => q.materia === filters.materia);
        }
        if (filters.assunto) {
          questoes = questoes.filter(q => q.assunto === filters.assunto);
        }
        if (filters.nivel) {
          questoes = questoes.filter(q => q.nivel === filters.nivel);
        }
        if (filters.limit) {
          questoes = questoes.slice(0, filters.limit);
        }

        resolve(questoes);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao buscar questões:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Armazenar progresso do usuário
   */
  async storeProgressoOffline(progresso) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progresso'], 'readwrite');
      const store = transaction.objectStore('progresso');

      store.put(progresso);

      transaction.oncomplete = () => {
        console.log('[OfflineService] Progresso armazenado offline');
        resolve();
      };

      transaction.onerror = () => {
        console.error('[OfflineService] Erro ao armazenar progresso:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Buscar progresso offline
   */
  async getProgressoOffline(usuarioId) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progresso'], 'readonly');
      const store = transaction.objectStore('progresso');
      const index = store.index('usuario');
      const request = index.getAll(usuarioId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao buscar progresso:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Salvar resposta offline
   */
  async saveRespostaOffline(resposta) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['respostas'], 'readwrite');
      const store = transaction.objectStore('respostas');

      const respostaData = {
        ...resposta,
        timestamp: new Date().toISOString(),
        pendente: true,
        usuario: resposta.usuario || this.getCurrentUser()?.id
      };

      const request = store.add(respostaData);

      request.onsuccess = () => {
        console.log('[OfflineService] Resposta salva offline:', request.result);
        this.addToSyncQueue('resposta', respostaData);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao salvar resposta:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Armazenar livro didático offline
   */
  async storeLivroOffline(livro) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['livros'], 'readwrite');
      const store = transaction.objectStore('livros');

      store.put(livro);

      transaction.oncomplete = () => {
        console.log('[OfflineService] Livro armazenado offline');
        resolve();
      };

      transaction.onerror = () => {
        console.error('[OfflineService] Erro ao armazenar livro:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Buscar livros offline
   */
  async getLivrosOffline(filters = {}) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['livros'], 'readonly');
      const store = transaction.objectStore('livros');
      const request = store.getAll();

      request.onsuccess = () => {
        let livros = request.result;

        // Aplicar filtros
        if (filters.categoria) {
          livros = livros.filter(l => l.categoria === filters.categoria);
        }
        if (filters.nivel) {
          livros = livros.filter(l => l.nivel === filters.nivel);
        }

        resolve(livros);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao buscar livros:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Salvar nota/destaque offline
   */
  async saveNotaOffline(nota) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notas'], 'readwrite');
      const store = transaction.objectStore('notas');

      const notaData = {
        ...nota,
        timestamp: new Date().toISOString(),
        usuario: nota.usuario || this.getCurrentUser()?.id,
        pendente: true
      };

      const request = store.add(notaData);

      request.onsuccess = () => {
        console.log('[OfflineService] Nota salva offline');
        this.addToSyncQueue('nota', notaData);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao salvar nota:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Buscar notas offline
   */
  async getNotasOffline(usuarioId) {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['notas'], 'readonly');
      const store = transaction.objectStore('notas');
      const index = store.index('usuario');
      const request = index.getAll(usuarioId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[OfflineService] Erro ao buscar notas:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Adicionar item à fila de sincronização
   */
  addToSyncQueue(type, data) {
    this.syncQueue.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    // Persistir fila de sincronização
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  /**
   * Sincronizar dados offline
   */
  async syncOfflineData() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log('[OfflineService] Iniciando sincronização de', this.syncQueue.length, 'itens');

    const syncPromises = this.syncQueue.map(async (item) => {
      try {
        await this.syncItem(item);
        return item;
      } catch (error) {
        console.error('[OfflineService] Erro ao sincronizar item:', error);
        return null;
      }
    });

    const results = await Promise.allSettled(syncPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null);

    // Remover itens sincronizados da fila
    this.syncQueue = this.syncQueue.filter(item =>
      !successful.some(success => success.value === item)
    );

    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));

    if (successful.length > 0) {
      this.showNotification(`${successful.length} itens sincronizados com sucesso!`, 'success');
    }

    // Notificar Service Worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_COMPLETED',
        data: { synced: successful.length, remaining: this.syncQueue.length }
      });
    }
  }

  /**
   * Sincronizar item individual
   */
  async syncItem(item) {
    const { type, data } = item;

    switch (type) {
      case 'resposta':
        await this.syncResposta(data);
        break;
      case 'nota':
        await this.syncNota(data);
        break;
      case 'progresso':
        await this.syncProgresso(data);
        break;
      default:
        throw new Error(`Tipo de sincronização não reconhecido: ${type}`);
    }
  }

  /**
   * Sincronizar resposta
   */
  async syncResposta(resposta) {
    const response = await fetch('/api/respostas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(resposta)
    });

    if (!response.ok) {
      throw new Error('Erro ao sincronizar resposta');
    }
  }

  /**
   * Sincronizar nota
   */
  async syncNota(nota) {
    const response = await fetch('/api/notas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(nota)
    });

    if (!response.ok) {
      throw new Error('Erro ao sincronizar nota');
    }
  }

  /**
   * Sincronizar progresso
   */
  async syncProgresso(progresso) {
    const response = await fetch('/api/progresso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(progresso)
    });

    if (!response.ok) {
      throw new Error('Erro ao sincronizar progresso');
    }
  }

  /**
   * Obter usuário atual (placeholder - implementar baseado no sistema de auth)
   */
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Obter token de autenticação
   */
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Exibir notificação
   */
  showNotification(message, type = 'info') {
    // Usar sistema de notificações existente ou implementar um simples
    const event = new CustomEvent('showNotification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  /**
   * Obter estatísticas offline
   */
  async getOfflineStats() {
    if (!this.db) await this.initializeIndexedDB();

    return new Promise((resolve, reject) => {
      const stats = {};
      const transaction = this.db.transaction(['questoes', 'respostas', 'progresso', 'livros']);

      transaction.objectStore('questoes').count().onsuccess = (e) => {
        stats.questoes = e.target.result;
      };

      transaction.objectStore('respostas').count().onsuccess = (e) => {
        stats.respostas = e.target.result;
      };

      transaction.objectStore('progresso').count().onsuccess = (e) => {
        stats.progresso = e.target.result;
      };

      transaction.objectStore('livros').count().onsuccess = (e) => {
        stats.livros = e.target.result;
      };

      transaction.oncomplete = () => {
        stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
        stats.lastSync = localStorage.getItem('lastSync');
        resolve(stats);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Limpar dados offline (útil para logout)
   */
  async clearOfflineData() {
    if (this.db) {
      const transaction = this.db.transaction(['questoes', 'respostas', 'progresso', 'livros', 'notas'], 'readwrite');

      transaction.objectStore('questoes').clear();
      transaction.objectStore('respostas').clear();
      transaction.objectStore('progresso').clear();
      transaction.objectStore('livros').clear();
      transaction.objectStore('notas').clear();

      return new Promise((resolve) => {
        transaction.oncomplete = () => {
          console.log('[OfflineService] Dados offline limpos');
          this.syncQueue = [];
          localStorage.removeItem('syncQueue');
          resolve();
        };
      });
    }
  }
}

// Criar instância singleton
const offlineService = new OfflineService();

// Tornar disponível globalmente
window.offlineService = offlineService;

export default offlineService;