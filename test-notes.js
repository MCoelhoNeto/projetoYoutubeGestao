// Teste da funcionalidade de notas
const testNotes = async () => {
  console.log('🧪 Testando funcionalidade de notas...');
  
  // Simular dados de teste
  const testData = {
    analysisId: '507f1f77bcf86cd799439011', // ID de exemplo
    noteData: {
      text: 'Teste de anotação',
      type: 'resumo'
    }
  };
  
  console.log('📝 Dados de teste:', testData);
  
  try {
    // Testar a API PATCH
    const response = await fetch(`/api/analyses/${testData.analysisId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData.noteData)
    });
    
    console.log('📡 Resposta da API:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sucesso:', result);
    } else {
      const error = await response.json();
      console.log('❌ Erro:', error);
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error);
  }
};

// Executar teste se estiver no browser
if (typeof window !== 'undefined') {
  window.testNotes = testNotes;
  console.log('🔧 Função de teste disponível: window.testNotes()');
}

module.exports = { testNotes }; 