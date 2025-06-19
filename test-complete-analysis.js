// Teste completo do fluxo de análise
const { GoogleGenerativeAI } = require('@google/generative-ai');
// @ts-ignore
const TranscriptClient = require('youtube-transcript-api');

async function testCompleteAnalysis() {
  try {
    console.log('🧪 Teste completo do fluxo de análise...');
    
    // 1. Testar transcrição
    console.log('\n📄 1. Testando transcrição...');
    const videoId = 'Rvoictk6KaY';
    
    const client = new TranscriptClient();
    await client.ready;
    const transcriptData = await client.getTranscript(videoId);
    
    let transcript = '';
    if (transcriptData && transcriptData.tracks && transcriptData.tracks.length > 0) {
      const track = transcriptData.tracks[0];
      if (track.transcript && Array.isArray(track.transcript)) {
        transcript = track.transcript.map(item => item.text || item).join(' ');
      }
    } else if (transcriptData && Array.isArray(transcriptData)) {
      transcript = transcriptData.map(item => item.text || item).join(' ');
    }
    
    if (!transcript.trim()) {
      console.log('❌ Falha na transcrição');
      return;
    }
    
    console.log(`✅ Transcrição obtida (${transcript.length} caracteres)`);
    
    // 2. Testar Gemini
    console.log('\n🤖 2. Testando Gemini...');
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY não está definida');
      return;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
Analise esta transcrição de vídeo e forneça um resumo simples:

TRANSCRIÇÃO:
${transcript.substring(0, 500)}...

Responda apenas com um resumo de 2-3 linhas.
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    console.log('✅ Análise gerada:', analysis.substring(0, 200) + '...');
    
    console.log('\n🎉 Teste completo realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Configure GEMINI_API_KEY no .env.local');
    } else if (error.message.includes('quota')) {
      console.log('💡 Verifique a quota da API Gemini');
    }
  }
}

testCompleteAnalysis(); 