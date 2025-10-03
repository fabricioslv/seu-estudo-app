# 📋 Documentação da API - Seu Estudo

## Visão Geral

Esta documentação descreve a API REST do **Seu Estudo**, uma plataforma educacional brasileira focada na preparação para ENEM e vestibulares.

**Base URL de Produção:**
- Frontend: `https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app`
- Backend: `https://backend-pahg8frz6-fabricioslvs-projects.vercel.app`

**Base URL de Desenvolvimento:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:6001`

---

## 🔐 Autenticação

### Login
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_aqui",
  "usuario": {
    "id": 1,
    "nome": "Nome do Usuário",
    "email": "usuario@email.com",
    "tipo": "aluno",
    "data_cadastro": "2025-01-01T10:00:00Z"
  }
}
```

**Response (401):**
```json
{
  "msg": "Credenciais inválidas"
}
```

### Registro
**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "nome": "Nome Completo",
  "email": "usuario@email.com",
  "senha": "senha123",
  "tipo": "aluno"
}
```

**Response (201):**
```json
{
  "msg": "Usuário registrado com sucesso",
  "usuario_id": 1
}
```

---

## 📚 Gestão de Questões

### Listar Questões
**Endpoint:** `GET /api/questoes`

**Query Parameters:**
- `materia`: Filtrar por matéria (matematica, portugues, etc.)
- `dificuldade`: Filtrar por dificuldade (1=fácil, 2=médio, 3=difícil)
- `ano`: Filtrar por ano do ENEM
- `limit`: Número máximo de resultados (padrão: 50)
- `offset`: Offset para paginação

**Response (200):**
```json
{
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto da questão...",
      "alternativas": {
        "A": "Alternativa A",
        "B": "Alternativa B",
        "C": "Alternativa C",
        "D": "Alternativa D"
      },
      "resposta_correta": "B",
      "materia": "matematica",
      "dificuldade": 2,
      "ano": 2023,
      "fonte": "ENEM 2023"
    }
  ],
  "total": 150,
  "pagina": 1,
  "total_paginas": 3
}
```

### Obter Questão por ID
**Endpoint:** `GET /api/questoes/:id`

**Response (200):**
```json
{
  "id": 1,
  "enunciado": "Texto da questão...",
  "alternativas": {
    "A": "Alternativa A",
    "B": "Alternativa B",
    "C": "Alternativa C",
    "D": "Alternativa D"
  },
  "resposta_correta": "B",
  "explicacao": "Explicação detalhada da resposta...",
  "materia": "matematica",
  "dificuldade": 2,
  "ano": 2023,
  "fonte": "ENEM 2023"
}
```

### Criar Nova Questão (Professores/Admin)
**Endpoint:** `POST /api/questoes`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "enunciado": "Texto da questão",
  "alternativas": {
    "A": "Alternativa A",
    "B": "Alternativa B",
    "C": "Alternativa C",
    "D": "Alternativa D"
  },
  "resposta_correta": "B",
  "materia": "matematica",
  "dificuldade": 2,
  "ano": 2024,
  "fonte": "Questão personalizada"
}
```

**Response (201):**
```json
{
  "msg": "Questão criada com sucesso",
  "questao_id": 1
}
```

---

## 📝 Gestão de Simulados

### Listar Simulados
**Endpoint:** `GET /api/simulados`

**Query Parameters:**
- `tipo`: Tipo de simulado (enem, personalizado)
- `materia`: Filtrar por matéria
- `dificuldade`: Nível de dificuldade
- `limit`: Número de resultados

**Response (200):**
```json
{
  "simulados": [
    {
      "id": 1,
      "titulo": "Simulado ENEM 2023 - Matemática",
      "descricao": "Simulado completo de matemática",
      "tipo": "enem",
      "materia": "matematica",
      "dificuldade": 2,
      "tempo_limite": 5400,
      "numero_questoes": 45,
      "data_criacao": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 25
}
```

### Obter Simulado por ID
**Endpoint:** `GET /api/simulados/:id`

**Response (200):**
```json
{
  "id": 1,
  "titulo": "Simulado ENEM 2023 - Matemática",
  "descricao": "Simulado completo de matemática",
  "tipo": "enem",
  "materia": "matematica",
  "dificuldade": 2,
  "tempo_limite": 5400,
  "numero_questoes": 45,
  "questoes": [
    {
      "id": 1,
      "enunciado": "Texto da questão...",
      "alternativas": {
        "A": "Alternativa A",
        "B": "Alternativa B",
        "C": "Alternativa C",
        "D": "Alternativa D"
      },
      "resposta_correta": "B"
    }
  ],
  "data_criacao": "2025-01-01T10:00:00Z"
}
```

### Criar Simulado Personalizado (Professores)
**Endpoint:** `POST /api/simulados`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "titulo": "Simulado Personalizado - Geometria",
  "descricao": "Questões específicas de geometria",
  "tipo": "personalizado",
  "materia": "matematica",
  "dificuldade": 2,
  "tempo_limite": 3600,
  "questoes_ids": [1, 5, 10, 15, 20]
}
```

---

## 📊 Gestão de Desempenho

### Obter Desempenho do Usuário
**Endpoint:** `GET /api/desempenho`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `periodo`: Período (semana, mes, ano)
- `materia`: Filtrar por matéria

**Response (200):**
```json
{
  "desempenho": {
    "total_simulados": 15,
    "media_acertos": 78.5,
    "tempo_medio": 45.2,
    "materias": {
      "matematica": {
        "acertos": 82,
        "tentativas": 50,
        "media_tempo": 42.5
      },
      "portugues": {
        "acertos": 75,
        "tentativas": 45,
        "media_tempo": 48.1
      }
    },
    "evolucao": [
      { "data": "2025-01-01", "acertos": 70 },
      { "data": "2025-01-08", "acertos": 75 },
      { "data": "2025-01-15", "acertos": 82 }
    ]
  }
}
```

### Registrar Resultado de Simulado
**Endpoint:** `POST /api/desempenho/resultado`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "simulado_id": 1,
  "respostas": {
    "1": "B",
    "2": "A",
    "3": "C"
  },
  "tempo_gasto": 1800,
  "data_realizacao": "2025-01-01T10:00:00Z"
}
```

---

## 🎮 Sistema de Gamificação

### Obter Pontuação do Usuário
**Endpoint:** `GET /api/gamificacao/pontuacao`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "pontuacao": {
    "pontos_atuais": 15420,
    "nivel": 12,
    "pontos_proximo_nivel": 1800,
    "conquistas": [
      {
        "id": 1,
        "nome": "Primeiro Acerto",
        "descricao": "Acertou a primeira questão",
        "icone": "🎯",
        "data_conquista": "2025-01-01T10:00:00Z"
      }
    ],
    "ranking": {
      "posicao_global": 156,
      "posicao_materia": 23,
      "total_usuarios": 15420
    }
  }
}
```

### Obter Ranking
**Endpoint:** `GET /api/gamificacao/ranking`

**Query Parameters:**
- `tipo`: global, materia, mensal
- `materia`: Matéria específica (se tipo=materia)
- `limit`: Número de resultados (padrão: 50)

**Response (200):**
```json
{
  "ranking": [
    {
      "posicao": 1,
      "usuario_id": 123,
      "nome": "Maria Silva",
      "pontos": 25420,
      "nivel": 18,
      "avatar": "https://..."
    },
    {
      "posicao": 2,
      "usuario_id": 456,
      "nome": "João Santos",
      "pontos": 23890,
      "nivel": 17,
      "avatar": "https://..."
    }
  ],
  "usuario_atual": {
    "posicao": 156,
    "pontos": 15420,
    "nivel": 12
  }
}
```

---

## 📚 Gestão de Livros Didáticos

### Listar Livros
**Endpoint:** `GET /api/livros`

**Query Parameters:**
- `materia`: Filtrar por matéria
- `autor`: Filtrar por autor
- `limit`: Número de resultados

**Response (200):**
```json
{
  "livros": [
    {
      "id": 1,
      "titulo": "Matemática para ENEM",
      "autor": "João Silva",
      "materia": "matematica",
      "ano": 2024,
      "arquivo_pdf": "matematica-enem-2024.pdf",
      "capa_url": "https://...",
      "data_cadastro": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 45
}
```

### Processar Livro Didático
**Endpoint:** `POST /api/livros/processar`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request:** FormData com arquivo PDF

**Response (200):**
```json
{
  "msg": "Livro processado com sucesso",
  "livro_id": 1,
  "paginas_processadas": 150,
  "capitulos_encontrados": 12,
  "questoes_extraidas": 45
}
```

### Obter Conteúdo do Livro
**Endpoint:** `GET /api/livros/:id/conteudo`

**Response (200):**
```json
{
  "livro": {
    "id": 1,
    "titulo": "Matemática para ENEM",
    "autor": "João Silva"
  },
  "conteudo": [
    {
      "capitulo": "Funções",
      "topicos": [
        {
          "titulo": "Função Linear",
          "conteudo": "Texto do tópico...",
          "pagina": 25
        }
      ]
    }
  ]
}
```

---

## 👥 Gestão de Usuários

### Obter Perfil do Usuário
**Endpoint:** `GET /api/usuarios/perfil`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "usuario": {
    "id": 1,
    "nome": "Nome do Usuário",
    "email": "usuario@email.com",
    "tipo": "aluno",
    "avatar": "https://...",
    "data_cadastro": "2025-01-01T10:00:00Z",
    "preferencias": {
      "materias_favoritas": ["matematica", "fisica"],
      "modo_escuro": false,
      "notificacoes": true
    }
  }
}
```

### Atualizar Perfil
**Endpoint:** `PUT /api/usuarios/perfil`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "nome": "Nome Atualizado",
  "preferencias": {
    "modo_escuro": true,
    "notificacoes": false
  }
}
```

---

## 💬 Sistema de Mensagens

### Listar Conversas
**Endpoint:** `GET /api/mensagens/conversas`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "conversas": [
    {
      "id": 1,
      "participante": {
        "id": 2,
        "nome": "Professor Silva",
        "tipo": "professor",
        "avatar": "https://..."
      },
      "ultima_mensagem": {
        "texto": "Como posso ajudar?",
        "data_envio": "2025-01-01T14:30:00Z",
        "lida": false
      }
    }
  ]
}
```

### Obter Mensagens da Conversa
**Endpoint:** `GET /api/mensagens/conversas/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "conversa_id": 1,
  "mensagens": [
    {
      "id": 1,
      "remetente_id": 2,
      "texto": "Olá! Como posso ajudar com matemática?",
      "data_envio": "2025-01-01T14:25:00Z",
      "lida": true
    },
    {
      "id": 2,
      "remetente_id": 1,
      "texto": "Preciso de ajuda com funções",
      "data_envio": "2025-01-01T14:28:00Z",
      "lida": true
    }
  ]
}
```

### Enviar Mensagem
**Endpoint:** `POST /api/mensagens/conversas/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "texto": "Mensagem de texto"
}
```

---

## 🤖 Recursos de IA

### Obter Explicação com IA
**Endpoint:** `POST /api/ai/explicacao`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "questao_id": 1,
  "tipo_explicacao": "detalhada",
  "contexto_usuario": "estudante nivel medio"
}
```

**Response (200):**
```json
{
  "explicacao": "Explicação detalhada gerada pela IA...",
  "fonte": "Google AI Studio",
  "confiabilidade": 0.95,
  "tempo_resposta": 1.2
}
```

### Gerar Plano de Estudos Personalizado
**Endpoint:** `POST /api/ai/plano-estudos`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "objetivo": "Passar no ENEM com nota acima de 800 em matemática",
  "tempo_disponivel": "2 horas por dia",
  "nivel_atual": "medio",
  "materias_prioritarias": ["matematica", "fisica"]
}
```

**Response (200):**
```json
{
  "plano": {
    "titulo": "Plano Personalizado para ENEM",
    "duracao_total": "90 dias",
    "atividades_diarias": [
      {
        "dia": 1,
        "materia": "matematica",
        "topico": "Funções Lineares",
        "atividade": "Estudar teoria e resolver exercícios",
        "tempo_estimado": "45 minutos"
      }
    ],
    "metas_semanais": [
      {
        "semana": 1,
        "objetivo": "Dominar funções básicas",
        "simulado_recomendado": 1
      }
    ]
  }
}
```

---

## 📊 Análise e Relatórios (Professores/Admin)

### Relatório de Desempenho da Turma
**Endpoint:** `GET /api/relatorios/turma/:turma_id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `periodo`: semana, mes, semestre
- `materia`: Matéria específica

**Response (200):**
```json
{
  "turma": {
    "id": 1,
    "nome": "Turma 3º Ano A",
    "total_alunos": 35
  },
  "relatorio": {
    "media_geral": 72.5,
    "alunos_acima_media": 18,
    "materias_mais_dificeis": [
      { "materia": "matematica", "media": 68.2 },
      { "materia": "fisica", "media": 70.1 }
    ],
    "evolucao_turma": [
      { "semana": "2025-01", "media": 70 },
      { "semana": "2025-02", "media": 72.5 }
    ]
  }
}
```

### Estatísticas Gerais da Plataforma
**Endpoint:** `GET /api/admin/estatisticas`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "estatisticas": {
    "usuarios_totais": 15420,
    "usuarios_ativos_hoje": 2340,
    "simulados_realizados_hoje": 156,
    "questoes_respondidas_hoje": 4680,
    "tempo_medio_sessao": 25.5,
    "taxa_retencao_diaria": 0.82,
    "materias_mais_estudadas": [
      { "materia": "matematica", "estudantes": 4520 },
      { "materia": "portugues", "estudantes": 3890 }
    ]
  }
}
```

---

## 🔔 Sistema de Notificações

### Listar Notificações do Usuário
**Endpoint:** `GET /api/notificacoes`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `lidas`: true/false (filtrar por status de leitura)
- `tipo`: conquista, lembrete, sistema
- `limit`: Número de resultados

**Response (200):**
```json
{
  "notificacoes": [
    {
      "id": 1,
      "tipo": "conquista",
      "titulo": "Nova Conquista!",
      "mensagem": "Você desbloqueou a conquista 'Matemático Iniciante'",
      "data_criacao": "2025-01-01T10:00:00Z",
      "lida": false,
      "icone": "🏆"
    }
  ],
  "total_nao_lidas": 5
}
```

### Marcar Notificação como Lida
**Endpoint:** `PUT /api/notificacoes/:id/lida`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## 🔧 Utilitários e Configurações

### Verificar Status da API
**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T10:00:00Z",
  "versao": "2.0.0",
  "servicos": {
    "database": "connected",
    "ai_service": "available",
    "file_storage": "available"
  }
}
```

### Obter Configurações do Sistema
**Endpoint:** `GET /api/config`

**Response (200):**
```json
{
  "config": {
    "manutencao": false,
    "versao_minima_app": "2.0.0",
    "recursos_habilitados": [
      "quiz",
      "livros_didaticos",
      "gamificacao",
      "mensagens",
      "explicacoes_ia"
    ],
    "limites": {
      "simulados_por_dia": 5,
      "mensagens_por_hora": 20,
      "upload_tamanho_maximo": "50MB"
    }
  }
}
```

---

## 📋 Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Muitas requisições |
| 500 | Internal Server Error - Erro interno |

---

## 🚨 Tratamento de Erros

Todos os endpoints retornam erros no formato:

```json
{
  "error": true,
  "msg": "Mensagem de erro descritiva",
  "codigo": "CODIGO_ERRO_ESPECIFICO",
  "detalhes": {
    "campo": "Mensagem específica do campo"
  }
}
```

---

## 🔒 Segurança

### Autenticação JWT
- Token válido por 24 horas
- Refresh token disponível via `POST /api/auth/refresh`
- Logout automático em dispositivos suspeitos

### Rate Limiting
- 100 requisições por minuto por usuário
- 1000 requisições por minuto por IP

### Validação de Dados
- Sanitização de todos os inputs
- Validação de tipos e formatos
- Proteção contra SQL injection e XSS

---

## 📚 Exemplos de Uso

### Exemplo 1: Login e obtenção de questões
```bash
# 1. Fazer login
curl -X POST https://backend-pahg8frz6-fabricioslvs-projects.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","senha":"senha123"}'

# 2. Usar token para obter questões
curl -X GET "https://backend-pahg8frz6-fabricioslvs-projects.vercel.app/api/questoes?materia=matematica&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Exemplo 2: Criar e responder simulado
```javascript
// 1. Criar simulado personalizado
const simulado = await fetch('/api/simulados', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    titulo: 'Meu Simulado',
    questoes_ids: [1, 2, 3, 4, 5]
  })
});

// 2. Responder simulado
const resultado = await fetch('/api/desempenho/resultado', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    simulado_id: 1,
    respostas: {
      1: 'B',
      2: 'A',
      3: 'C'
    }
  })
});
```

---

## 📞 Suporte e Contato

Para dúvidas técnicas ou suporte:
- **Email**: suporte@seuestudo.com.br
- **Documentação Técnica**: [GitHub Wiki](https://github.com/seu-estudo/docs)
- **Status da API**: [Status Page](https://status.seuestudo.com.br)

**Última atualização**: 30 de Setembro de 2025
**Versão da API**: 2.0.0