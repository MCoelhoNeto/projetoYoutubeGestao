const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testando APIs...\n');

  try {
    // Teste 1: API simples
    console.log('1️⃣ Testando API simples...');
    const simpleResponse = await axios.get(`${BASE_URL}/api/test-simple`);
    console.log('✅ API simples funcionando:', simpleResponse.data);
  } catch (error) {
    console.log('❌ API simples falhou:', error.response?.status, error.response?.data);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Teste com diferentes vídeos
  const testVideos = [
    'dQw4w9WgXcQ', // Rick Roll
    'jNQXAC9IVRw', // Me at the zoo (primeiro vídeo do YouTube)
    'kJQP7kiw5Fk', // Despacito
    '9bZkp7q19f0'  // Gangnam Style
  ];

  for (const videoId of testVideos) {
    try {
      console.log(`2️⃣ Testando API de transcrição com vídeo: ${videoId}`);
      const transcriptResponse = await axios.post(`${BASE_URL}/api/test-transcript`, {
        videoId: videoId
      });
      console.log(`✅ Resultado para ${videoId}:`, transcriptResponse.data);
      
      if (transcriptResponse.data.testResults.transcriptObtained) {
        console.log(`🎉 Transcrição encontrada para ${videoId}!`);
        break;
      }
    } catch (error) {
      console.log(`❌ API de transcrição falhou para ${videoId}:`, error.response?.status, error.response?.data);
    }
    
    console.log('\n' + '-'.repeat(30) + '\n');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  try {
    // Teste 3: API de check-transcript
    console.log('3️⃣ Testando API check-transcript...');
    const checkResponse = await axios.post(`${BASE_URL}/api/check-transcript`, {
      videoId: 'jNQXAC9IVRw' // Me at the zoo
    });
    console.log('✅ API check-transcript funcionando:', checkResponse.data);
  } catch (error) {
    console.log('❌ API check-transcript falhou:', error.response?.status, error.response?.data);
  }
}

testAPI().catch(console.error); 