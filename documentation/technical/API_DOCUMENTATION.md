# Seu-Estudo Backend API Documentation

## Base URL
`http://localhost:6001/api`

## Authentication
Most endpoints require a valid JWT token in the header:
```
x-auth-token: <your-jwt-token>
```

## Endpoints

---

## Authentication

### POST /api/auth/register
Register a new user

**Body:**
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token"
}
```

### POST /api/auth/login
Login user and receive JWT token

**Body:**
```json
{
  "email": "string",
  "senha": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token"
}
```

### GET /api/auth/csrf-token
Generate a CSRF token for protection against CSRF attacks

**Response:**
```json
{
  "csrfToken": "csrf-token-string"
}
```

---

## Questões (Questions)

### GET /api/questoes/by-subject/:subject
Get questions by subject

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "subject": "string",
  "questions": [],
  "limit": 10,
  "offset": 0
}
```

### GET /api/questoes/by-year/:year
Get questions by year

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)

**Response:**
```json
{
  "success": true,
  "year": 2023,
  "questions": [],
  "limit": 10,
  "offset": 0
}
```

### GET /api/questoes/stats
Get statistics about questions in the database

**Response:**
```json
{
  "success": true,
  "stats": {}
}
```

### POST /api/questoes/resolve
Register a question response

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "questaoId": "number",
  "resposta": "string",
  "tempoResposta": "number"
}
```

### POST /api/questoes/resolve-multiple
Register multiple question responses

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "respostas": [
    {
      "questaoId": "number",
      "resposta": "string",
      "tempoResposta": "number"
    }
  ]
}
```

---

## Gamificação (Gamification)

### GET /api/gamificacao/pontos/:userId
Get points for a user

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "userId": "number",
  "pontosGeral": "number",
  "pontosEstudo": "number",
  "nivel": "number",
  "experiencia": "number",
  "experienciaNecessaria": "number"
}
```

### POST /api/gamificacao/pontos/:userId
Add points to a user

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "pontos": "number",
  "tipo": "string",
  "descricao": "string"
}
```

### GET /api/gamificacao/conquistas/:userId
Get user achievements

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "userId": "number",
  "conquistas": [],
  "conquistasNaoObtidas": []
}
```

### GET /api/gamificacao/ranking
Get user ranking

**Header:**
- `x-auth-token`: JWT token

**Query Parameters:**
- `periodo`: "geral" | "mensal" | "semanal" (default: "geral")

---

## Simulados (Mock Exams)

### GET /api/simulados
Get available mock exams for the student

**Header:**
- `x-auth-token`: JWT token

### GET /api/simulados/:id
Get a specific mock exam

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "success": true,
  "simulado": {},
  "questoes": []
}
```

### POST /api/simulados/:id/responder
Respond to questions in a mock exam

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "respostas": [
    {
      "questaoId": "number",
      "resposta": "string"
    }
  ]
}
```

### GET /api/simulados/:id/resultados
Get results for a mock exam

**Header:**
- `x-auth-token`: JWT token

---

## Tutoria (Tutoring)

### POST /api/tutoria/tutores
Become a tutor

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "bio": "string",
  "materias": "array",
  "disponibilidade": "string"
}
```

### GET /api/tutoria/tutores
Get all available tutors

### POST /api/tutoria/sessoes
Request a tutoring session

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "tutor_id": "number",
  "materia": "string",
  "horario_solicitado": "string"
}
```

### GET /api/tutoria/sessoes
Get user's tutoring sessions (as tutor or student)

**Header:**
- `x-auth-token`: JWT token

### PUT /api/tutoria/sessoes/:id
Update tutoring session status

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "status": "string"
}
```

---

## Notificações (Notifications)

### GET /api/notificacoes
Get user notifications

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "notificacoes": []
}
```

### POST /api/notificacoes
Create a notification (for internal use)

**Header:**
- `x-auth-token`: JWT token

### PUT /api/notificacoes/:id/lida
Mark notification as read

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "success": true,
  "notificacao": {}
}
```

### PUT /api/notificacoes/marcar-todas-lidas
Mark all notifications as read

**Header:**
- `x-auth-token`: JWT token

**Response:**
```json
{
  "success": true,
  "totalAtualizado": "number"
}
```

---

## Professor Simulados (Professor Mock Exams)

### GET /api/professor/simulados
Get mock exams created by the authenticated professor

**Header:**
- `x-auth-token`: JWT token

### POST /api/professor/simulados
Create a new mock exam

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "titulo": "string",
  "descricao": "string",
  "materia": "string",
  "questoesIds": "array"
}
```

### PUT /api/professor/simulados/:id
Update a mock exam

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "titulo": "string",
  "descricao": "string",
  "materia": "string",
  "questoesIds": "array"
}
```

### DELETE /api/professor/simulados/:id
Delete a mock exam

**Header:**
- `x-auth-token`: JWT token

---

## Mensagens (Messages)

### POST /api/mensagens
Send a message

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "destinatario_id": "number",
  "conteudo": "string"
}
```

### GET /api/mensagens/:userId
Get messages with a user

**Header:**
- `x-auth-token`: JWT token

### PUT /api/mensagens/:id/lida
Mark message as read

**Header:**
- `x-auth-token`: JWT token

---

## Planos de Estudo (Study Plans)

### GET /api/questoes/planos
Get user's study plans

**Header:**
- `x-auth-token`: JWT token

### POST /api/questoes/planos
Generate a study plan based on AI

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "objetivo": "string",
  "materias": "array",
  "dificuldade": "string",
  "duracao": "number"
}
```

### GET /api/questoes/planos/:id
Get a specific study plan

**Header:**
- `x-auth-token`: JWT token

### PUT /api/questoes/planos/:id
Update a study plan

**Header:**
- `x-auth-token`: JWT token

**Body:**
```json
{
  "titulo": "string",
  "descricao": "string",
  "status": "string"
}
```

---

## Health Check

### GET /api/health
Get system health status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO date string",
  "services": {
    "database": "ok | error",
    "redis": "ok | error",
    "api": "ok | error"
  }
}
```

---

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not found
- `500`: Internal server error