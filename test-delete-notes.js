// Teste da funcionalidade de deletar notas
const testDeleteNotes = async () => {
  console.log('🗑️ Testando funcionalidade de deletar notas...');
  
  // Simular dados de teste
  const testData = {
    analysisId: '6852ffc50409cde19131bf58', // ID da análise
    noteIndex: 0 // Índice da primeira nota
  };
  
  console.log('📝 Dados de teste:', testData);
  
  try {
    // Testar a API DELETE
    const response = await fetch(`/api/analyses/${testData.analysisId}?noteIndex=${testData.noteIndex}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📡 Resposta da API:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sucesso ao deletar:', result);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Erro ao deletar:', error);
      return false;
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error);
    return false;
  }
};

// Executar teste se estiver no browser
if (typeof window !== 'undefined') {
  window.testDeleteNotes = testDeleteNotes;
  console.log('🔧 Função de teste disponível: window.testDeleteNotes()');
}

module.exports = { testDeleteNotes }; 