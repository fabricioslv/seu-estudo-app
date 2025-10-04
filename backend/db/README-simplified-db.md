# Banco de Dados Simplificado - Supabase

Este documento explica como usar o script SQL simplificado criado para resolver problemas de dependências e complexidade no banco de dados.

## 📋 Problema Resolvido

O banco de dados original tinha:
- ❌ Muitas tabelas complexas
- ❌ Problemas de dependências entre tabelas
- ❌ Erros de foreign keys antes das tabelas referenciadas
- ❌ Script muito complexo para começar

## ✅ Solução Implementada

Criamos um script SQL simplificado com:

### Tabelas Essenciais (7 tabelas apenas):
1. **`usuarios`** - Tabela base (usuários do sistema)
2. **`professores`** - Dependentes de usuarios
3. **`alunos`** - Dependentes de usuarios
4. **`livros`** - Tabela base (livros didáticos)
5. **`questoes`** - Tabela base (questões para estudo)
6. **`simulados`** - Dependentes de usuarios
7. **`respostas_usuario`** - Dependentes de usuarios e questoes

### Características do Script:

#### ✅ Ordem de Criação Correta:
- **Tabelas Base** primeiro (sem dependências)
- **Tabelas Nível 1** depois (dependem apenas de tabelas base)
- **Tabelas Nível 2** por último (múltiplas dependências)

#### ✅ Foreign Keys Mínimas:
```sql
-- Apenas as realmente necessárias:
professores.usuario_id → usuarios.id
alunos.usuario_id → usuarios.id
simulados.criado_por → usuarios.id
respostas_usuario.usuario_id → usuarios.id
respostas_usuario.questao_id → questoes.id
respostas_usuario.simulado_id → simulados.id (nullable)
```

#### ✅ RLS Habilitado e Configurado:
- Row Level Security ativado em todas as tabelas
- Políticas básicas funcionais
- Permissões adequadas para cada tabela

#### ✅ Funcional para Aplicações:
- Estrutura suficiente para apps básicos
- Relacionamentos funcionais
- Dados de teste incluídos

## 🚀 Como Usar

### 1. Executar o Script Principal

No **Supabase SQL Editor**, execute o arquivo:
```sql
-- Copie e cole o conteúdo de:
backend/db/init-simplified-db.sql
```

### 2. Testar Funcionalidade

Execute o arquivo de teste:
```sql
-- Copie e cole o conteúdo de:
backend/db/test-simplified-db.sql
```

### 3. Verificar Criação

O script de teste irá:
- ✅ Verificar se todas as tabelas foram criadas
- ✅ Mostrar estrutura das tabelas
- ✅ Verificar constraints e foreign keys
- ✅ Testar inserção de dados
- ✅ Testar relacionamentos entre tabelas
- ✅ Confirmar RLS habilitado

## 📊 Estrutura das Tabelas

### usuarios (Tabela Base)
```sql
id (SERIAL PRIMARY KEY)
nome, email, senha_hash, tipo_usuario, data_criacao
```

### livros (Tabela Base)
```sql
id (SERIAL PRIMARY KEY)
titulo, autor, ano, area, arquivo_pdf, capa_url, data_cadastro
```

### questoes (Tabela Base)
```sql
id (SERIAL PRIMARY KEY)
titulo, materia, dificuldade, alternativas, resposta_correta, explicacao
```

### professores (Nível 1)
```sql
id (SERIAL PRIMARY KEY)
usuario_id (FK → usuarios.id)
especialidade, experiencia_anos, bio, certificado_url
```

### alunos (Nível 1)
```sql
id (SERIAL PRIMARY KEY)
usuario_id (FK → usuarios.id)
nivel_escolar, serie, escola, ano_letivo
```

### simulados (Nível 1)
```sql
id (SERIAL PRIMARY KEY)
titulo, descricao, materia, dificuldade, duracao_minutos
criado_por (FK → usuarios.id)
datas e status
```

### respostas_usuario (Nível 2)
```sql
id (SERIAL PRIMARY KEY)
usuario_id (FK → usuarios.id)
questao_id (FK → questoes.id)
simulado_id (FK → simulados.id, nullable)
resposta_usuario, esta_correta, tempo_resposta
```

## 🔒 Configuração RLS

Todas as tabelas têm RLS habilitado com políticas básicas:

- **Leitura**: Geralmente pública (para conteúdo educativo)
- **Escrita**: Autenticada (usuários podem criar/editar seus dados)
- **Segurança**: Usuários só acessam seus próprios dados onde necessário

## 🧪 Dados de Teste

O script de teste insere dados básicos para verificar funcionamento:

- 1 usuário (aluno/professor)
- 1 livro didático
- 1 questão de exemplo
- Relacionamentos entre tabelas

## 📈 Expansão Futura

Este script simplificado permite expansão futura:

1. **Adicionar tabelas** sem quebrar dependências
2. **Expandir funcionalidades** gradualmente
3. **Manter estrutura limpa** e organizada
4. **Adicionar complexidade** conforme necessário

## ✅ Critérios de Aceitação Atendidos

- ✅ Script executa sem erros no Supabase
- ✅ Todas as foreign keys são válidas
- ✅ Estrutura funcional para aplicações
- ✅ RLS habilitado e configurado
- ✅ Problemas de dependências resolvidos
- ✅ Apenas tabelas essenciais incluídas

## 🛠️ Arquivos Criados

1. **`init-simplified-db.sql`** - Script principal do banco
2. **`test-simplified-db.sql`** - Testes de validação
3. **`README-simplified-db.md`** - Esta documentação

---

**🎉 Pronto para uso!** O banco de dados simplificado está funcional e pronto para desenvolvimento de aplicações básicas no Supabase.