import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');

  try {
    // Carregar configuração do arquivo .env
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Extrair variáveis de ambiente
    const supabaseUrlMatch = envContent.match(/SUPABASE_URL=(.+)/);
    const supabaseAnonKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

    const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1] : null;
    const supabaseAnonKey = supabaseAnonKeyMatch ? supabaseAnonKeyMatch[1] : null;

    console.log('📋 Configuração carregada do .env:');
    console.log('- URL:', supabaseUrl);
    console.log('- Chave configurada:', supabaseAnonKey ? '✅ Presente' : '❌ Ausente');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configurações do Supabase não encontradas no arquivo .env');
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
