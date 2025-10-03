/**
 * Service Worker para Seu-Estudo PWA
 * Implementa estratégias avançadas de cache e funcionalidades offline
 */

const CACHE_NAME = 'seu-estudo-v1';
const API_CACHE_NAME = 'seu-estudo-api-v1';
const OFFLINE_DATA_CACHE = 'seu-estudo-offline-v1';

// Recursos críticos que sempre devem estar em cache
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Recursos de API que devem ser armazenados offline
const API_ENDPOINTS = [
  '/api/questoes',
  '/api/livros',
  '/api/simulados',
  '/api/progresso'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

/**
 * Instalação do Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker');

  event.waitUntil(
    (async () => {
      try {
        // Criar caches necessários
        const cache = await caches.open(CACHE_NAME);
        const apiCache = await caches.open(API_CACHE_NAME);
        const offlineCache = await caches.open(OFFLINE_DATA_CACHE);

        // Cache dos recursos críticos
        await cache.addAll(CRITICAL_RESOURCES);

        // Inicializar cache de dados offline com estrutura básica
        await initializeOfflineData(offlineCache);

        console.log('[SW] Recursos críticos armazenados em cache');
      } catch (error) {
        console.error('[SW] Erro durante instalação:', error);
      }
    })()
  );

  // Forçar ativação imediata
  self.skipWaiting();
});

/**
 * Ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker');

  event.waitUntil(
    (async () => {
      try {
        // Limpar caches antigos
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, API_CACHE_NAME, OFFLINE_DATA_CACHE].includes(cacheName)) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );

        // Assumir controle de todas as páginas abertas
        await clients.claim();

        console.log('[SW] Service Worker ativado');
      } catch (error) {
        console.error('[SW] Erro durante ativação:', error);
      }
    })()
  );
});

/**
 * Interceptação de requisições
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia para recursos estáticos (CSS, JS, imagens)
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
  }
  // Estratégia para requisições de API
  else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  }
  // Estratégia para páginas HTML
  else if (isHTMLRequest(request)) {
    event.respondWith(handleHTMLRequest(request));
  }
  // Outros recursos
  else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Sincronização em background
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronização:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * Notificações push
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Notificação push recebida');

  if (event.data) {
    const data = event.data.json();
    showNotification(data);
  }
});

/**
 * Verifica se é recurso estático
 */
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
}

/**
 * Verifica se é requisição de API
 */
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.hostname.includes('api');
}

/**
 * Verifica se é requisição HTML
 */
function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

/**
 * Estratégia Cache First para recursos estáticos
 */
async function handleStaticResource(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Revalidar em background
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response);
          });
        }
      }).catch(() => {
        // Ignorar erros de revalidação
      });

      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Erro ao carregar recurso estático:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Estratégia Network First para APIs críticas
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);

  // Para endpoints específicos, usar cache offline
  if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    return handleOfflineDataRequest(request);
  }

  try {
    // Tentar rede primeiro
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      // Armazenar resposta em cache para uso offline
      const apiCache = await caches.open(API_CACHE_NAME);
      apiCache.put(request, networkResponse.clone());

      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Usando cache para API:', url.pathname);

    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Se não há cache, tentar dados offline
    return handleOfflineDataRequest(request);
  }
}

/**
 * Estratégia para páginas HTML
 */
async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    // Retornar página offline personalizada
    return caches.match('/offline.html') || new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Seu-Estudo - Modo Offline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .offline-container {
              max-width: 500px;
              padding: 2rem;
            }
            .offline-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .offline-title {
              font-size: 2rem;
              margin-bottom: 1rem;
            }
            .offline-message {
              font-size: 1.1rem;
              line-height: 1.6;
              margin-bottom: 2rem;
            }
            .retry-btn {
              background: white;
              color: #667eea;
              border: none;
              padding: 1rem 2rem;
              font-size: 1rem;
              border-radius: 25px;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .retry-btn:hover {
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📚</div>
            <h1 class="offline-title">Você está offline</h1>
            <p class="offline-message">
              Não se preocupe! Você pode continuar estudando com o conteúdo que já foi baixado.
              Suas respostas e progresso serão sincronizados quando a conexão voltar.
            </p>
            <button class="retry-btn" onclick="window.location.reload()">
              Tentar novamente
            </button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

/**
 * Requisição genérica com Stale While Revalidate
 */
async function handleGenericRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Gerenciamento de dados offline
 */
async function handleOfflineDataRequest(request) {
  const offlineCache = await caches.open(OFFLINE_DATA_CACHE);

  try {
    // Tentar buscar dados atualizados da rede
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Atualizar cache offline com novos dados
      await offlineCache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Usando dados offline');

    // Retornar dados do cache offline
    const cachedResponse = await offlineCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retornar resposta padrão offline
    return new Response(JSON.stringify({
      offline: true,
      message: 'Dados offline não disponíveis',
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Inicializar dados offline básicos
 */
async function initializeOfflineData(cache) {
  const offlineData = {
    questoes: [],
    livros: [],
    progresso: {},
    timestamp: Date.now(),
    version: '1.0'
  };

  await cache.put('/offline-data', new Response(JSON.stringify(offlineData)));
}

/**
 * Sincronizar dados offline
 */
async function syncOfflineData() {
  try {
    console.log('[SW] Iniciando sincronização de dados offline');

    // Buscar dados pendentes de sincronização
    const offlineCache = await caches.open(OFFLINE_DATA_CACHE);
    const pendingData = await offlineCache.match('/pending-sync');

    if (pendingData) {
      const data = await pendingData.json();

      // Tentar sincronizar cada item
      for (const item of data) {
        try {
          await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
          });

          // Remover item sincronizado
          data.splice(data.indexOf(item), 1);
        } catch (error) {
          console.error('[SW] Erro ao sincronizar item:', error);
        }
      }

      // Atualizar lista de pendências
      if (data.length > 0) {
        await offlineCache.put('/pending-sync', new Response(JSON.stringify(data)));
      } else {
        await offlineCache.delete('/pending-sync');
      }
    }

    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro durante sincronização:', error);
  }
}

/**
 * Exibir notificação
 */
function showNotification(data) {
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: data.tag || 'seu-estudo-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {}
  };

  self.registration.showNotification(data.title, options);
}

/**
 * Adicionar dados para sincronização pendente
 */
async function addPendingSync(url, method, headers, body) {
  const offlineCache = await caches.open(OFFLINE_DATA_CACHE);
  const pendingData = await offlineCache.match('/pending-sync');

  let data = [];
  if (pendingData) {
    data = await pendingData.json();
  }

  data.push({
    url,
    method,
    headers,
    body,
    timestamp: Date.now()
  });

  await offlineCache.put('/pending-sync', new Response(JSON.stringify(data)));
}

// Exportar função para uso externo (se necessário)
self.addPendingSync = addPendingSync;