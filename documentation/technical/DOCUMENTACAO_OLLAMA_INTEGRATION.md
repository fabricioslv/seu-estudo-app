# 🚀 Integração com Ollama - Seu Estudo

## Visão Geral

Esta documentação descreve a integração avançada do **Seu Estudo** com o **Ollama**, uma plataforma para execução de modelos de linguagem localmente. Esta integração permite funcionalidades avançadas de IA sem dependência de serviços externos pagos.

## 🎯 Objetivos da Integração

### ✅ Funcionalidades Implementadas

1. **🧠 Embeddings Semânticos**
   - Modelo `nomic-embed-text` para geração de embeddings
   - Busca semântica inteligente em livros didáticos
   - Similaridade de conteúdo baseada em contexto

2. **💬 Chat com Livros**
   - Modelo `llama3.1:8b` para conversação natural
   - Contexto baseado no conteúdo real dos livros
   - Respostas educativas e personalizadas

3. **📚 Processamento Inteligente**
   - Extração automática de conceitos-chave
   - Geração de resumos contextuais
   - Criação de questões personalizadas

4. **🔍 Busca Avançada**
   - Busca semântica com filtros
   - Recomendações baseadas em desempenho
   - Sistema de busca conversacional

## 🏗️ Arquitetura da Integração

### Componentes Principais

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │     Ollama      │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Local AI)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Busca IA      │    │  Embedding       │    │   Modelos       │
│   Interface     │    │  Service         │    │   Locais        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Fluxo de Dados

1. **Usuário faz consulta** → Frontend captura e envia
2. **Backend processa** → Valida e prepara dados
3. **Ollama processa** → Gera embeddings ou respostas
4. **Resultado retorna** → Interface exibe resposta

## 📋 Instalação e Configuração

### 1. Instalação do Ollama

```bash
# Download e instalação (Linux/Mac)
curl -fsSL https://ollama.ai/install.sh | sh

# No Windows
# Download manual em: https://ollama.ai/download
```

### 2. Inicialização e Modelos

```bash
# Iniciar serviço Ollama
ollama serve

# Puxar modelos necessários (em outro terminal)
ollama pull nomic-embed-text  # Para embeddings
ollama pull llama3.1:8b        # Para chat e análise
ollama pull llama3.1:70b       # Modelo maior (opcional)
```

### 3. Verificação da Instalação

```bash
# Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Listar modelos instalados
ollama list

# Testar modelo
ollama run llama3.1:8b "Olá, me explique funções matemáticas"
```

## 🔧 Configuração do Backend

### Variáveis de Ambiente

```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.1:8b
OLLAMA_TIMEOUT=30000
OLLAMA_MAX_RETRIES=3
```

### Inicialização Automática

```javascript
// services/ollamaService.js
class OllamaService {
    async initializeModels() {
        const models = ['nomic-embed-text', 'llama3.1:8b'];

        for (const model of models) {
            try {
                await this.pullModel(model);
                console.log(`✅ Modelo ${model} inicializado`);
            } catch (error) {
                console.error(`❌ Erro ao inicializar ${model}:`, error);
            }
        }
    }
}
```

## 📚 Funcionalidades Detalhadas

### 3.1 Embeddings Semânticos

#### Geração de Embeddings
```javascript
// Gera embedding para texto
const embedding = await ollamaService.generateEmbedding("Funções lineares na matemática");

console.log(embedding); // Array de 768 números (nomic-embed-text)
```

#### Busca Semântica
```javascript
// Busca conteúdo similar
const results = await embeddingService.semanticSearch(
    "Como resolver equações lineares?",
    livroId, // opcional
    5 // topK
);

results.forEach(result => {
    console.log(`Similaridade: ${result.similarity}`);
    console.log(`Texto: ${result.chunk_text}`);
});
```

#### Cálculo de Similaridade
```javascript
cosineSimilarity(vecA, vecB) {
    // Implementação do cálculo de similaridade cosseno
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

    return dotProduct / (normA * normB);
}
```

### 3.2 Chat com Livros

#### Implementação Básica
```javascript
const resposta = await ollamaService.chatWithBook(
    conteudoDoLivro,
    perguntaDoUsuario
);

console.log(resposta); // Resposta educativa baseada no livro
```

#### Contexto Dinâmico
```javascript
// Buscar contexto relevante automaticamente
const contextoRelevante = await embeddingService.getSimilarContent(
    pergunta,
    livroId,
    3 // número de chunks
);

// Gerar resposta baseada no contexto
const resposta = await ollamaService.chatWithBook(
    contextoRelevante.map(c => c.chunk_text).join('\n'),
    pergunta
);
```

### 3.3 Processamento de Livros

#### Extração com IA
```javascript
// Processar capítulo com IA
const conceitos = await ollamaService.extractKeyConcepts(conteudo);
const resumo = await ollamaService.summarizeContent(conteudo);
const questoes = await ollamaService.generateQuestions(conteudo, 'medio', 5);
```

#### Geração de Embeddings
```javascript
// Dividir livro em chunks
const chunks = await embeddingService.createChunksFromBookContent(
    livroContent,
    1000, // tamanho do chunk
    200   // overlap
);

// Gerar embeddings
const results = await embeddingService.generateBookEmbeddings(livroId, chunks);
```

## 🎮 Uso Prático

### 4.1 Página de Busca Inteligente

#### Funcionalidades Disponíveis
- **Busca semântica** em toda a biblioteca
- **Chat conversacional** com livros específicos
- **Filtros avançados** por matéria e dificuldade
- **Recomendações personalizadas**
- **Interface responsiva** e moderna

#### Exemplo de Uso
```javascript
// Busca semântica
const searchResults = await fetch('/api/livros/search', {
    method: 'POST',
    body: JSON.stringify({
        query: "explique funções quadráticas",
        topK: 10
    })
});

// Chat com livro
const chatResponse = await fetch(`/api/livros/${livroId}/chat`, {
    method: 'POST',
    body: JSON.stringify({
        question: "Como calcular o vértice de uma parábola?"
    })
});
```

### 4.2 Recomendações Personalizadas

```javascript
// Obter recomendações baseadas no desempenho
const recomendacoes = await fetch('/api/livros/recommendations');

// Baseado em:
// - Matérias com melhor desempenho
// - Tempo dedicado a cada assunto
// - Progressão de aprendizado
```

## 📊 Monitoramento e Performance

### 5.1 Métricas de Uso

```javascript
// Estatísticas da integração
const stats = {
    ollama: ollamaService.getStatus(),
    embeddings: embeddingService.getStats(),
    performance: {
        tempo_medio_resposta: 1.2, // segundos
        taxa_sucesso: 0.95,
        embeddings_gerados: 15420,
        consultas_processadas: 8750
    }
};
```

### 5.2 Logs e Debugging

```javascript
// Logs estruturados
const logger = {
    timestamp: new Date().toISOString(),
    servico: 'ollama-integration',
    acao: 'chat_with_book',
    livro_id: livroId,
    pergunta: question.substring(0, 100),
    tempo_resposta: 1250, // ms
    sucesso: true
};
```

## 🔧 Troubleshooting

### 6.1 Problemas Comuns

#### Ollama não Conecta
```bash
# Verificar se Ollama está rodando
curl http://localhost:11434/api/tags

# Reiniciar serviço
ollama serve

# Verificar logs
journalctl -u ollama -f  # Linux
```

#### Modelos não Encontrados
```bash
# Puxar modelo novamente
ollama pull nomic-embed-text
ollama pull llama3.1:8b

# Listar modelos disponíveis
ollama list

# Remover e reinstalar modelo
ollama rm modelo-problematico
ollama pull modelo-problematico
```

#### Memória Insuficiente
```bash
# Configurar Ollama para usar menos memória
OLLAMA_MAX_LOADED=1 OLLAMA_MAX_QUEUE=256 ollama serve

# Ou usar modelo menor
ollama pull llama3.1:8b  # ao invés de 70b
```

### 6.2 Debugging

#### Verificar Embeddings
```javascript
// Teste de geração de embeddings
const testEmbedding = await ollamaService.generateEmbedding("teste");
console.log(`Embedding gerado: ${testEmbedding.length} dimensões`);
```

#### Testar Chat
```javascript
// Teste de chat básico
const resposta = await ollamaService.chatWithBook(
    "Matemática básica inclui números e operações.",
    "O que é matemática básica?"
);
console.log("Resposta:", resposta);
```

## 🚀 Performance e Otimização

### 7.1 Estratégias de Cache

```javascript
// Cache de embeddings
const cacheKey = `embedding:${text}`;
let embedding = await cache.get(cacheKey);

if (!embedding) {
    embedding = await ollamaService.generateEmbedding(text);
    await cache.set(cacheKey, embedding, 3600); // 1 hora
}
```

### 7.2 Processamento Assíncrono

```javascript
// Processar livros em background
async function processBooksInBackground() {
    const livros = await getLivrosPendentes();

    for (const livro of livros) {
        // Não aguardar resultado, processar em paralelo
        processarLivroComIA(livro.id).catch(console.error);
    }
}
```

### 7.3 Otimização de Prompts

```javascript
// Prompt otimizado para respostas rápidas
const promptOtimizado = `
Baseado no conteúdo: ${conteudo}
Pergunta: ${pergunta}
Resposta direta e educativa:`;

// Configurações de geração
const options = {
    temperature: 0.3,  // Mais determinístico
    top_p: 0.9,        // Melhor qualidade
    num_predict: 200   // Limitar tamanho
};
```

## 🔒 Segurança e Privacidade

### 8.1 Processamento Local

- **✅ Dados ficam locais** - Não envia para serviços externos
- **✅ Privacidade garantida** - Conteúdo estudantil protegido
- **✅ Controle total** - Você decide quais dados processar

### 8.2 Sanitização de Dados

```javascript
// Limpar conteúdo antes de enviar para IA
function sanitizeContent(content) {
    return content
        .replace(/dados pessoais/gi, '[DADOS REMOVIDOS]')
        .replace(/email:.+/gi, '[EMAIL REMOVIDO]')
        .substring(0, 8000); // Limitar tamanho
}
```

## 📈 Escalabilidade

### 9.1 Multiplas Instâncias

```javascript
// Configuração para múltiplos workers
const ollamaWorkers = [
    'http://localhost:11434',
    'http://localhost:11435',
    'http://localhost:11436'
];

class OllamaLoadBalancer {
    async generateEmbedding(text) {
        const worker = this.getNextWorker();
        return await this.callWorker(worker, 'embeddings', { text });
    }
}
```

### 9.2 Estratégias de Cache

```javascript
// Cache multinível
const cache = {
    // Memória (rápido, volátil)
    memory: new Map(),

    // Redis (rápido, persistente)
    redis: redisClient,

    // Arquivo (lento, permanente)
    file: fileCache
};
```

## 🎓 Exemplos de Uso Avançado

### 10.1 Sistema de Recomendação

```javascript
// Análise de desempenho do usuário
const desempenho = await analisarDesempenhoUsuario(userId);

// Recomendar livros baseados em gaps
const recomendacoes = await gerarRecomendacoes(
    desempenho.materiasBaixoDesempenho,
    desempenho.tempoDisponivel
);
```

### 10.2 Geração de Plano de Estudos

```javascript
// Gerar plano personalizado
const plano = await ollamaService.generateStudyPlan({
    objetivo: "Aprovar no ENEM com 800+ em matemática",
    tempoDisponivel: "2 horas/dia",
    nivelAtual: "intermediario",
    pontosFracos: ["geometria", "estatistica"]
});
```

## 📚 Recursos Adicionais

### Documentação Oficial
- [Ollama Docs](https://docs.ollama.ai/)
- [Modelos Disponíveis](https://ollama.ai/library)
- [Exemplos de Uso](https://docs.ollama.ai/examples/)

### Modelos Recomendados
- **nomic-embed-text**: Melhor para embeddings em português
- **llama3.1:8b**: Balanceado para chat e análise
- **llama3.1:70b**: Para respostas mais sofisticadas (mais pesado)

### Comunidade
- [Discord Ollama](https://discord.gg/ollama)
- [GitHub Issues](https://github.com/jmorganca/ollama/issues)
- [Reddit r/Ollama](https://reddit.com/r/ollama)

## 🔄 Atualizações e Manutenção

### Verificar Novas Versões
```bash
# Atualizar Ollama
ollama update

# Verificar modelos atualizados
ollama pull nomic-embed-text  # Re-puxar modelo
```

### Backup de Configurações
```bash
# Exportar modelos
ollama list > modelos-backup.txt

# Reimportar se necessário
cat modelos-backup.txt | xargs -I {} ollama pull {}
```

---

## 🎉 Conclusão

A integração com Ollama transforma o **Seu Estudo** em uma plataforma verdadeiramente inteligente e privada:

- **🔒 Privacidade Total** - Dados processados localmente
- **⚡ Performance Superior** - Respostas instantâneas
- **🧠 Inteligência Avançada** - Compreensão contextual de livros
- **📈 Escalabilidade** - Controle total sobre recursos
- **💰 Custo Zero** - Sem dependência de APIs pagas

**🚀 Seu Estudo com Ollama - Educação inteligente, privada e gratuita!**

*Última atualização: 30 de Setembro de 2025*