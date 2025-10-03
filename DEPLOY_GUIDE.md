# Configuração de Deploy para Produção - Seu-Estudo

## 🚀 DEPLOY NO VERCEL (Frontend)

### 1. Preparação do Frontend
```bash
# No diretório frontend
npm run build
```

### 2. Configuração no Vercel
- Conectar repositório GitHub
- Configurar variáveis de ambiente:
  - `REACT_APP_API_URL=https://seu-estudo-backend.vercel.app/api`
  - `NEXT_PUBLIC_SUPABASE_URL=https://omhcypacmlnreiizqhdo.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🗄️ DEPLOY NO SUPABASE (Backend)

### 1. Configuração do Banco
- Banco já configurado: `postgresql://postgres:Vpn.3229bz!@db.omhcypacmlnreiizqhdo.supabase.co:5432/postgres`
- Tabelas já criadas via `backend/db/init.js`

### 2. Deploy do Backend
```bash
# Instalar Vercel CLI
npm i -g vercel

# No diretório backend
vercel --prod
```

### 3. Configuração de Variáveis no Vercel
- `DATABASE_URL=postgresql://postgres:Vpn.3229bz!@db.omhcypacmlnreiizqhdo.supabase.co:5432/postgres`
- `JWT_SECRET=G3EF0DbuXYWaxj4QD8HmhyB/gAPsf08yalYNlKHlIvAYJGz5u35dBMqb4hgoO2LdNZJ8bEkdutDgjSa55vgWsQ==`
- `GOOGLE_AI_API_KEY=AIzaSyCar9-7ff7vsVCL7-hxjj3q_WkXMxwa5D8`

## 🔧 CONFIGURAÇÕES DE PRODUÇÃO

### Frontend (.env.production)
```
REACT_APP_API_URL=https://seu-estudo-backend.vercel.app/api
NEXT_PUBLIC_SUPABASE_URL=https://omhcypacmlnreiizqhdo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (.env.production)
```
DATABASE_URL=postgresql://postgres:Vpn.3229bz!@db.omhcypacmlnreiizqhdo.supabase.co:5432/postgres
JWT_SECRET=G3EF0DbuXYWaxj4QD8HmhyB/gAPsf08yalYNlKHlIvAYJGz5u35dBMqb4hgoO2LdNZJ8bEkdutDgjSa55vgWsQ==
GOOGLE_AI_API_KEY=AIzaSyCar9-7ff7vsVCL7-hxjj3q_WkXMxwa5D8
NODE_ENV=production
```

## 📋 CHECKLIST DE DEPLOY

- [ ] Testar scripts PowerShell localmente
- [ ] Verificar conexão com Supabase
- [ ] Build do frontend sem erros
- [ ] Deploy do backend no Vercel
- [ ] Deploy do frontend no Vercel
- [ ] Configurar domínio personalizado
- [ ] Testar funcionalidades em produção
- [ ] Configurar monitoramento

## 🌐 URLs DE PRODUÇÃO
- Frontend: https://seu-estudo.vercel.app
- Backend: https://seu-estudo-backend.vercel.app
- Banco: Supabase (já configurado)
