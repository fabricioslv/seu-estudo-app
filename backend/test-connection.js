const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');

  try {
    // Carregar configuração
    const configPath = path.join(__dirname, 'config', 'health-checks.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log('📋 Configuração carregada:');
    console.log('- URL:', config.supabase.url);
    console.log('- Chave configurada:', config.supabase.anonKey ? '✅ Presente' : '❌ Ausente');

    // Criar cliente Supabase
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);

    // Teste básico de conexão
    const { data, error, status } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      console.log('Código de erro:', error.code);
      console.log('Detalhes:', error.details);
      return false;
    }

    console.log('✅ Conexão estabelecida com sucesso');
    console.log('Status:', status);
    console.log('Dados recebidos:', data);

    return true;

  } catch (error) {
    console.log('❌ Erro geral na conexão:', error.message);
    console.log('Stack trace:', error.stack);
    return false;
  }
}

testConnection();
