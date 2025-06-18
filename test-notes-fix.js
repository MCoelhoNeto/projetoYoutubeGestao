// Teste da correção da funcionalidade de notas
const testNotesFix = async () => {
  console.log('🧪 Testando correção da funcionalidade de notas...');
  
  // Simular dados de teste
  const testData = {
    analysisId: '6852ffc50409cde19131bf58', // ID da análise que estava dando erro
    noteData: {
      text: 'Teste após correção',
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
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Erro:', error);
      return false;
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error);
    return false;
  }
};

// Executar teste se estiver no browser
if (typeof window !== 'undefined') {
  window.testNotesFix = testNotesFix;
  console.log('🔧 Função de teste disponível: window.testNotesFix()');
}

module.exports = { testNotesFix }; 