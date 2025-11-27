
import { removeProductDuplicates, removeSupplierDuplicates } from './cleanup-duplicates.js';

async function run() {
  const execute = process.argv.includes('--execute');
  console.log(`Iniciando limpeza headless (Modo: ${execute ? 'EXECUÇÃO REAL' : 'SIMULAÇÃO'})...`);
  
  try {
    console.log('\n--- PRODUTOS ---');
    const prodResults = await removeProductDuplicates(!execute);
    if (prodResults.length === 0) console.log('Nenhum produto duplicado encontrado.');
    else console.log(`${prodResults.length} ações de limpeza de produtos.`);

    console.log('\n--- FORNECEDORES ---');
    const suppResults = await removeSupplierDuplicates(!execute);
    if (suppResults.length === 0) console.log('Nenhum fornecedor duplicado encontrado.');
    else console.log(`${suppResults.length} ações de limpeza de fornecedores.`);

  } catch (e) {
    console.error('Erro na limpeza:', e);
    process.exit(1);
  }
}

run();
