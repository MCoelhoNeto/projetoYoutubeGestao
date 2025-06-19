// @ts-ignore
const TranscriptClient = require('youtube-transcript-api');

async function testTranscript(videoId) {
  try {
    const client = new TranscriptClient();
    await client.ready;
    console.log(`🔍 Buscando transcrição para: ${videoId}`);
    const transcriptData = await client.getTranscript(videoId);
    console.log('📄 Dados da transcrição:', transcriptData);
    if (transcriptData && transcriptData.tracks && transcriptData.tracks.length > 0) {
      const track = transcriptData.tracks[0];
      if (track.transcript && Array.isArray(track.transcript)) {
        const texto = track.transcript.map(item => item.text || item).join(' ');
        console.log('✅ Transcrição obtida! Primeiros 300 caracteres:');
        console.log(texto.substring(0, 300) + '...');
      } else {
        console.log('❌ Formato de transcrição inesperado dentro de tracks.');
      }
    } else if (transcriptData && Array.isArray(transcriptData)) {
      const texto = transcriptData.map(item => item.text || item).join(' ');
      console.log('✅ Transcrição obtida! Primeiros 300 caracteres:');
      console.log(texto.substring(0, 300) + '...');
    } else {
      console.log('❌ Não foi possível obter a transcrição ou formato inesperado.');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar transcrição:', error);
  }
}

// Teste com um vídeo famoso
// const videoId = 'dQw4w9WgXcQ'; // Rick Roll
const videoId = 'Rvoictk6KaY'; // 
testTranscript(videoId); 