require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function executeCompleteInit() {
  console.log('🚀 === INICIANDO CRIAÇÃO COMPLETA DO BANCO DE DADOS ===\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'init-complete-db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Arquivo SQL carregado com sucesso');
    console.log(`📏 Tamanho do arquivo: ${sqlContent.length} caracteres\n`);

    // Dividir o SQL em comandos individuais (separados por ;)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`🔧 Total de comandos SQL a executar: ${commands.length}\n`);

    // Executar cada comando
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
          await pool.query(command);
          successCount++;
          console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          errorCount++;
          console.log(`   ❌ Erro no comando ${i + 1}: ${error.message}`);

          // Se for erro de tabela já existente, continuar
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Tabela já existe, continuando...`);
            successCount++;
            errorCount--;
          }
        }
      }
    }

    console.log(`\n📊 === RESUMO DA EXECUÇÃO ===`);
    console.log(`=============================`);
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Erros encontrados: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);

    // Verificar se as tabelas foram criadas
    console.log(`\n🔍 === VERIFICANDO TABELAS CRIADAS ===`);

    const tabelasResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tabelasResult.rows.length > 0) {
      console.log(`\n✅ TABELAS CRIADAS COM SUCESSO (${tabelasResult.rows.length}):`);
      tabelasResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });

      // Verificar tabelas específicas
      const tabelasEsperadas = [
        'usuarios', 'respostas_usuario', 'simulados', 'simulado_questoes',
        'resultados_simulado', 'gamificacao_atividades', 'planos_estudo',
        'pontos_usuario', 'conquistas_usuario', 'ranking', 'desafios',
        'participacoes_desafio', 'livros', 'conquistas', 'questoes'
      ];

      const tabelasCriadas = tabelasResult.rows.map(row => row.table_name);
      const tabelasFaltantes = tabelasEsperadas.filter(tabela =>
        !tabelasCriadas.includes(tabela)
      );

      if (tabelasFaltantes.length === 0) {
        console.log(`\n🎉 SUCESSO TOTAL! Todas as ${tabelasEsperadas.length} tabelas foram criadas.`);
        console.log(`🎯 Sistema pronto para uso com RLS habilitado!`);
      } else {
        console.log(`\n⚠️  TABELAS FALTANTES (${tabelasFaltantes.length}):`);
        tabelasFaltantes.forEach(tabela => console.log(`  - ${tabela}`));
      }
    } else {
      console.log(`\n❌ ERRO: Nenhuma tabela foi criada!`);
    }

  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error.message);
  } finally {
    await pool.end();
    console.log(`\n🔚 Processo finalizado.`);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  executeCompleteInit().catch(console.error);
}

module.exports = { executeCompleteInit };