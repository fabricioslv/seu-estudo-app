// services/cacheService.js
// Service for caching frequently accessed data using Redis

import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class CacheService {
  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    } else {
      // For development/local use, fallback to in-memory cache
      this.redis = null;
      this.memoryCache = new Map();
      console.warn('Redis não configurado. Usando cache em memória (não recomendado para produção).');
    }

    this.defaultTTL = 300; // 5 minutos
  }

  async get(key) {
    try {
      if (this.redis) {
        const result = await this.redis.get(key);
        return result ? JSON.parse(result) : null;
      } else {
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error('Erro ao buscar do cache:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, value);
        // Simulate TTL for memory cache
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
      }
    } catch (error) {
      console.error('Erro ao definir cache:', error);
    }
  }

  async del(key) {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Erro ao deletar cache:', error);
    }
  }

  async flush() {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  // Cache a database query result
  async cacheQuery(key, queryFunction, ttl = this.defaultTTL) {
    // Check cache first
    let result = await this.get(key);
    if (result !== null) {
      return { data: result, fromCache: true };
    }

    // Execute query if not in cache
    result = await queryFunction();

    // Store in cache
    await this.set(key, result, ttl);

    return { data: result, fromCache: false };
  }

  // Generate cache key from query and parameters
  generateKey(query, params = []) {
    const queryHash = this.simpleHash(query);
    const paramsHash = params.length > 0 ? this.simpleHash(JSON.stringify(params)) : '';
    return `query:${queryHash}:${paramsHash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  // Specific caching methods for common app queries
  async cacheUser(userId) {
    const key = `user:${userId}`;
    return await this.cacheQuery(key, async () => {
      const db = await import('../db/index.js');
      const result = await db.query('SELECT id, nome, email FROM usuarios WHERE id = $1', [userId]);
      return result.rows[0] || null;
    }, 900); // 15 minutos for user data
  }

  async cacheQuestoesBySubject(subject, limit = 50) {
    const key = `questoes:subject:${subject}:limit:${limit}`;
    return await this.cacheQuery(key, async () => {
      const db = await import('../db/index.js');
      const result = await db.query(
        'SELECT * FROM questoes WHERE materia = $1 LIMIT $2',
        [subject, limit]
      );
      return result.rows;
    }, 600); // 10 minutos for questions by subject
  }

  async cacheLeaderboard(userId) {
    const key = `leaderboard:user:${userId}`;
    return await this.cacheQuery(key, async () => {
      const gamificacaoService = await import('./gamificacaoService.mjs');
      return await gamificacaoService.getUsuarioRanking(userId);
    }, 300); // 5 minutos for leaderboard data
  }
}

const cacheService = new CacheService();
export default cacheService;
