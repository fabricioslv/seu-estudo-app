-- Migration file to document current database schema and RLS policies
-- Generated on 2025-10-05

ALTER TABLE IF EXISTS public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.planos_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.respostas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alunos_select_policy ON public.alunos;
DROP POLICY IF EXISTS alunos_insert_policy ON public.alunos;
DROP POLICY IF EXISTS alunos_update_policy ON public.alunos;
DROP POLICY IF EXISTS alunos_delete_policy ON public.alunos;

CREATE POLICY alunos_select_policy ON public.alunos FOR SELECT USING (true);
CREATE POLICY alunos_insert_policy ON public.alunos FOR INSERT WITH CHECK (true);
CREATE POLICY alunos_update_policy ON public.alunos FOR UPDATE USING (true);
CREATE POLICY alunos_delete_policy ON public.alunos FOR DELETE USING (true);

DROP POLICY IF EXISTS livros_select_policy ON public.livros;
DROP POLICY IF EXISTS livros_insert_policy ON public.livros;
DROP POLICY IF EXISTS livros_update_policy ON public.livros;
DROP POLICY IF EXISTS livros_delete_policy ON public.livros;

CREATE POLICY livros_select_policy ON public.livros FOR SELECT USING (true);
CREATE POLICY livros_insert_policy ON public.livros FOR INSERT WITH CHECK (true);
CREATE POLICY livros_update_policy ON public.livros FOR UPDATE USING (true);
CREATE POLICY livros_delete_policy ON public.livros FOR DELETE USING (true);

DROP POLICY IF EXISTS mensagens_select_policy ON public.mensagens;
DROP POLICY IF EXISTS mensagens_insert_policy ON public.mensagens;
DROP POLICY IF EXISTS mensagens_update_policy ON public.mensagens;
DROP POLICY IF EXISTS mensagens_delete_policy ON public.mensagens;

CREATE POLICY mensagens_select_policy ON public.mensagens FOR SELECT USING (true);
CREATE POLICY mensagens_insert_policy ON public.mensagens FOR INSERT WITH CHECK (true);
CREATE POLICY mensagens_update_policy ON public.mensagens FOR UPDATE USING (true);
CREATE POLICY mensagens_delete_policy ON public.mensagens FOR DELETE USING (true);

DROP POLICY IF EXISTS notas_select_policy ON public.notas;
DROP POLICY IF EXISTS notas_insert_policy ON public.notas;
DROP POLICY IF EXISTS notas_update_policy ON public.notas;
DROP POLICY IF EXISTS notas_delete_policy ON public.notas;

CREATE POLICY notas_select_policy ON public.notas FOR SELECT USING (true);
CREATE POLICY notas_insert_policy ON public.notas FOR INSERT WITH CHECK (true);
CREATE POLICY notas_update_policy ON public.notas FOR UPDATE USING (true);
CREATE POLICY notas_delete_policy ON public.notas FOR DELETE USING (true);

DROP POLICY IF EXISTS notificacoes_select_policy ON public.notificacoes;
DROP POLICY IF EXISTS notificacoes_insert_policy ON public.notificacoes;
DROP POLICY IF EXISTS notificacoes_update_policy ON public.notificacoes;
DROP POLICY IF EXISTS notificacoes_delete_policy ON public.notificacoes;

CREATE POLICY notificacoes_select_policy ON public.notificacoes FOR SELECT USING (true);
CREATE POLICY notificacoes_insert_policy ON public.notificacoes FOR INSERT WITH CHECK (true);
CREATE POLICY notificacoes_update_policy ON public.notificacoes FOR UPDATE USING (true);
CREATE POLICY notificacoes_delete_policy ON public.notificacoes FOR DELETE USING (true);

DROP POLICY IF EXISTS planos_estudo_select_policy ON public.planos_estudo;
DROP POLICY IF EXISTS planos_estudo_insert_policy ON public.planos_estudo;
DROP POLICY IF EXISTS planos_estudo_update_policy ON public.planos_estudo;
DROP POLICY IF EXISTS planos_estudo_delete_policy ON public.planos_estudo;

CREATE POLICY usuarios_veem_apenas_seus_planos_producao ON public.planos_estudo 
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS professores_select_policy ON public.professores;
DROP POLICY IF EXISTS professores_insert_policy ON public.professores;
DROP POLICY IF EXISTS professores_update_policy ON public.professores;
DROP POLICY IF EXISTS professores_delete_policy ON public.professores;

CREATE POLICY professores_select_policy ON public.professores FOR SELECT USING (true);
CREATE POLICY professores_insert_policy ON public.professores FOR INSERT WITH CHECK (true);
CREATE POLICY professores_update_policy ON public.professores FOR UPDATE USING (true);
CREATE POLICY professores_delete_policy ON public.professores FOR DELETE USING (true);

DROP POLICY IF EXISTS questoes_select_policy ON public.questoes;
DROP POLICY IF EXISTS questoes_insert_policy ON public.questoes;
DROP POLICY IF EXISTS questoes_update_policy ON public.questoes;
DROP POLICY IF EXISTS questoes_delete_policy ON public.questoes;

CREATE POLICY questoes_select_policy ON public.questoes FOR SELECT USING (true);
CREATE POLICY questoes_insert_policy ON public.questoes FOR INSERT WITH CHECK (true);
CREATE POLICY questoes_update_policy ON public.questoes FOR UPDATE USING (true);
CREATE POLICY questoes_delete_policy ON public.questoes FOR DELETE USING (true);

DROP POLICY IF EXISTS respostas_usuario_select_policy ON public.respostas_usuario;
DROP POLICY IF EXISTS respostas_usuario_insert_policy ON public.respostas_usuario;
DROP POLICY IF EXISTS respostas_usuario_update_policy ON public.respostas_usuario;
DROP POLICY IF EXISTS respostas_usuario_delete_policy ON public.respostas_usuario;

CREATE POLICY respostas_usuario_select_policy ON public.respostas_usuario FOR SELECT USING (true);
CREATE POLICY respostas_usuario_insert_policy ON public.respostas_usuario FOR INSERT WITH CHECK (true);
CREATE POLICY respostas_usuario_update_policy ON public.respostas_usuario FOR UPDATE USING (true);
CREATE POLICY respostas_usuario_delete_policy ON public.respostas_usuario FOR DELETE USING (true);

DROP POLICY IF EXISTS simulados_select_policy ON public.simulados;
DROP POLICY IF EXISTS simulados_insert_policy ON public.simulados;
DROP POLICY IF EXISTS simulados_update_policy ON public.simulados;
DROP POLICY IF EXISTS simulados_delete_policy ON public.simulados;

CREATE POLICY simulados_select_policy ON public.simulados FOR SELECT USING (true);
CREATE POLICY simulados_insert_policy ON public.simulados FOR INSERT WITH CHECK (true);
CREATE POLICY simulados_update_policy ON public.simulados FOR UPDATE USING (true);
CREATE POLICY simulados_delete_policy ON public.simulados FOR DELETE USING (true);

DROP POLICY IF EXISTS teams_select_policy ON public.teams;
DROP POLICY IF EXISTS teams_insert_policy ON public.teams;
DROP POLICY IF EXISTS teams_update_policy ON public.teams;
DROP POLICY IF EXISTS teams_delete_policy ON public.teams;

CREATE POLICY teams_select_policy ON public.teams FOR SELECT USING (true);
CREATE POLICY teams_insert_policy ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY teams_update_policy ON public.teams FOR UPDATE USING (true);
CREATE POLICY teams_delete_policy ON public.teams FOR DELETE USING (true);

DROP POLICY IF EXISTS users_select_policy ON public.users;
DROP POLICY IF EXISTS users_insert_policy ON public.users;
DROP POLICY IF EXISTS users_update_policy ON public.users;
DROP POLICY IF EXISTS users_delete_policy ON public.users;

CREATE POLICY users_select_policy ON public.users FOR SELECT USING (true);
CREATE POLICY users_insert_policy ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY users_update_policy ON public.users FOR UPDATE USING (true);
CREATE POLICY users_delete_policy ON public.users FOR DELETE USING (true);

DROP POLICY IF EXISTS usuarios_select_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_insert_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_update_policy ON public.usuarios;
DROP POLICY IF EXISTS usuarios_delete_policy ON public.usuarios;

CREATE POLICY usuarios_select_policy ON public.usuarios FOR SELECT USING (true);
CREATE POLICY usuarios_insert_policy ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY usuarios_update_policy ON public.usuarios FOR UPDATE USING (true);
CREATE POLICY usuarios_delete_policy ON public.usuarios FOR DELETE USING (true);

