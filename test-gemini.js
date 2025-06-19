// Teste da API do Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('🧪 Testando API do Gemini...');
    
    // Verificar se a chave está definida
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY não está definida');
      console.log('💡 Defina a variável de ambiente GEMINI_API_KEY');
      return;
    }
    
    console.log('✅ GEMINI_API_KEY encontrada');
    
    // Inicializar o Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🤖 Fazendo teste simples...');
    
    const result = await model.generateContent('Diga "Olá, Gemini está funcionando!" em português');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Resposta do Gemini:', text);
    
  } catch (error) {
    console.error('❌ Erro ao testar Gemini:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Verifique se a chave da API está correta');
    } else if (error.message.includes('quota')) {
      console.log('💡 Verifique se você tem quota disponível na API');
    }
  }
}

testGemini(); 