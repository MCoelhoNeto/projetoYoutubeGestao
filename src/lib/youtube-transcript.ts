import axios from 'axios';
// @ts-ignore
import TranscriptClient from 'youtube-transcript-api';

interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptResponse {
  transcript: string;
  items: TranscriptItem[];
}

export class YouTubeTranscriptService {
  private static instance: YouTubeTranscriptService;

  private constructor() {}

  static getInstance(): YouTubeTranscriptService {
    if (!YouTubeTranscriptService.instance) {
      YouTubeTranscriptService.instance = new YouTubeTranscriptService();
    }
    return YouTubeTranscriptService.instance;
  }

  // Método estático para facilitar o uso
  static async getTranscript(videoId: string): Promise<string | null> {
    return YouTubeTranscriptService.getInstance().getTranscript(videoId);
  }

  static async hasTranscript(videoId: string): Promise<boolean> {
    return YouTubeTranscriptService.getInstance().hasTranscript(videoId);
  }

  async getTranscript(videoId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando transcrição para: ${videoId}`);
      
      // Tentar obter transcrição diretamente
      const transcript = await this.getTranscriptDirect(videoId);
      
      if (transcript && transcript.trim()) {
        console.log(`✅ Transcrição obtida, tamanho: ${transcript.length}`);
        return transcript;
      }

      console.log(`❌ Nenhuma transcrição encontrada para: ${videoId}`);
      return null;

    } catch (error) {
      console.error(`❌ Erro ao buscar transcrição para ${videoId}:`, error);
      return null;
    }
  }

  private async getTranscriptDirect(videoId: string): Promise<string | null> {
    try {
      console.log(`🌐 Inicializando cliente de transcrição para ${videoId}`);
      
      const client = new TranscriptClient();
      await client.ready;
      
      console.log(`📡 Fazendo requisição para: ${videoId}`);
      
      const transcriptData = await client.getTranscript(videoId);
      console.log(`📄 Dados recebidos:`, typeof transcriptData, Array.isArray(transcriptData) ? transcriptData.length : 'N/A');
      
      // Processar diferentes formatos de resposta
      let transcript = '';
      
      if (transcriptData && transcriptData.tracks && transcriptData.tracks.length > 0) {
        const track = transcriptData.tracks[0];
        if (track.transcript && Array.isArray(track.transcript)) {
          transcript = track.transcript.map((item: any) => item.text || item).join(' ');
        } else {
          console.log('❌ Formato de transcrição inesperado dentro de tracks.');
        }
      } else if (transcriptData && Array.isArray(transcriptData)) {
        transcript = transcriptData.map((item: any) => item.text || item).join(' ');
      } else if (typeof transcriptData === 'string') {
        transcript = transcriptData;
      } else {
        console.log(`❓ Formato não reconhecido:`, transcriptData);
        throw new Error('Formato de transcrição não reconhecido');
      }

      const result = transcript.trim();
      console.log(`✅ Transcrição processada, tamanho: ${result.length}`);
      return result || null;
      
    } catch (error) {
      console.error(`❌ Erro no getTranscriptDirect:`, error);
      throw error;
    }
  }

  // Método para verificar se um vídeo tem transcrição disponível
  async hasTranscript(videoId: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando se ${videoId} tem transcrição`);
      
      // Tentar obter transcrição diretamente
      const transcript = await this.getTranscriptDirect(videoId);
      const hasTranscript = Boolean(transcript && transcript.trim().length > 0);
      
      console.log(`📊 Resultado da verificação: ${hasTranscript} (${transcript?.length || 0} caracteres)`);
      return hasTranscript;
    } catch (error) {
      console.error(`❌ Erro ao verificar transcrição para ${videoId}:`, error);
      return false;
    }
  }
}

export default YouTubeTranscriptService.getInstance(); 