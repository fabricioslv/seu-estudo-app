import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tabelas esperadas conforme requisitos
const EXPECTED_TABLES = [
  'usuarios',
  'questoes',
  'livros',
  'simulados',
  'notas',
  'mensagens',
  'notificacoes'
];

async function testTables() {
  console.log('🔍 Verificando tabelas no Supabase...');

  try {
    // Carregar configuração do arquivo .env
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extrair variáveis de ambiente
    const supabaseUrlMatch = envContent.match(/SUPABASE_URL=(.+)/);
    const supabaseAnonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

    const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1] : null;
    const supabaseAnonKey = supabaseAnonKeyMatch ? supabaseAnonKeyMatch[1] : null;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configurações do Supabase não encontradas no arquivo .env');
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Consultar tabelas existentes usando a tabela de catálogo do PostgreSQL
    const { data: existingTables, error } = await supabase
      .rpc('get_tables_list');

    if (error) {
      console.log('❌ Erro ao consultar tabelas:', error.message);
      console.log('Tentando método alternativo...');

      // Método alternativo: tentar listar tabelas conhecidas
      const results = [];
      for (const tableName of EXPECTED_TABLES) {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (tableError) {
          console.log(`❌ Tabela '${tableName}': ${tableError.message}`);
          results.push({ name: tableName, exists: false, error: tableError.message });
        } else {
          console.log(`✅ Tabela '${tableName}': Existe`);
          results.push({ name: tableName, exists: true, error: null });
        }
      }

      return analyzeResults(results);
    }

    console.log('✅ Tabelas encontradas:', existingTables);
    return analyzeResults(existingTables);

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    console.log('Stack trace:', error.stack);
    return false;
  }
}

function analyzeResults(tables) {
  console.log('\n📊 ANÁLISE DAS TABELAS:');

  let existingCount = 0;
  let missingCount = 0;

  EXPECTED_TABLES.forEach(expectedTable => {
    const found = tables.find(t => t.name === expectedTable);
    if (found && found.exists !== false) {
      console.log(`✅ ${expectedTable}: Existe`);
      existingCount++;
    } else {
      console.log(`❌ ${expectedTable}: Faltando`);
      missingCount++;
    }
  });

  console.log(`\n📈 RESUMO:`);
  console.log(`- Tabelas existentes: ${existingCount}`);
  console.log(`- Tabelas faltando: ${missingCount}`);
  console.log(`- Total esperado: ${EXPECTED_TABLES.length}`);

  if (missingCount === 0) {
    console.log('🎉 Todas as tabelas estão presentes!');
    return true;
  } else {
    console.log(`⚠️  ${missingCount} tabela(s) estão faltando e precisam ser criadas.`);
    return false;
  }
}

testTables();
