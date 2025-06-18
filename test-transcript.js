const https = require('https');
const http = require('http');

// Função para fazer requisição HTTP
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testTranscriptAPI() {
  const testVideos = [
    { id: 'dQw4w9WgXcQ', name: 'Rick Roll' },
    { id: '9bZkp7q19f0', name: 'PSY - GANGNAM STYLE' },
    { id: 'kJQP7kiw5Fk', name: 'Luis Fonsi - Despacito' },
    { id: 'y6120QOlsfU', name: 'Sandstorm - Darude' }
  ];
  
  console.log('🧪 Testando API de transcrição com diferentes vídeos...');
  
  for (const video of testVideos) {
    console.log(`\n📹 Testando: ${video.name} (${video.id})`);
    
    try {
      // Teste detalhado
      const testResult = await makeRequest('http://localhost:3000/api/test-transcript', 'POST', { videoId: video.id });
      console.log('Status:', testResult.status);
      console.log('Tem transcrição:', testResult.data.testResults.hasTranscript);
      console.log('Transcrições disponíveis:', testResult.data.testResults.availableTranscripts.length);
      console.log('Transcrição obtida:', testResult.data.testResults.transcriptObtained);
      
      if (testResult.data.testResults.transcriptError) {
        console.log('❌ Erro:', testResult.data.testResults.transcriptError);
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
    }
  }
}

testTranscriptAPI(); 