// Usar import em vez de require para ES Modules
import { initLivros } from './init-livros.js';
import { initCapitulos } from './init-capitulos.js';
import { initTopicos } from './init-topicos.js';
import { initConteudos } from './init-conteudos.js';
import { initQuestoes } from './init-questoes.js';
import { initGabaritos } from './init-gabaritos.js';

async function initAllContentDb() {
  console.log('Iniciando a inicialização de todas as tabelas de conteúdo...');
  try {
    await initLivros();
    await initCapitulos();
    await initTopicos();
    await initConteudos();
    await initQuestoes();
    await initGabaritos();
    console.log(
      'Todas as tabelas de conteúdo foram inicializadas com sucesso.'
    );
  } catch (error) {
    console.error('Erro ao inicializar todas as tabelas de conteúdo:', error);
    process.exit(1);
  }
}

initAllContentDb();

module.exports = { initAllContentDb };
