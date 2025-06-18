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
  private baseUrl = 'https://www.youtube.com';

  private constructor() {}

  static getInstance(): YouTubeTranscriptService {
    if (!YouTubeTranscriptService.instance) {
      YouTubeTranscriptService.instance = new YouTubeTranscriptService();
    }
    return YouTubeTranscriptService.instance;
  }

  async getTranscript(videoId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando transcrição para: ${videoId}`);
      
      // Tentar diferentes idiomas
      const languages = ['pt', 'en', 'es', 'fr', 'de', 'it'];
      
      for (const lang of languages) {
        try {
          console.log(`🌐 Tentando idioma: ${lang}`);
          const transcript = await this.getTranscriptForLanguage(videoId, lang);
          if (transcript && transcript.trim()) {
            console.log(`✅ Transcrição obtida em ${lang}, tamanho: ${transcript.length}`);
            return transcript;
          }
        } catch (error) {
          console.log(`⚠️ Falha no idioma ${lang}:`, error instanceof Error ? error.message : 'Erro desconhecido');
          continue;
        }
      }

      // Se nenhum idioma funcionou, tentar sem especificar idioma
      try {
        console.log(`🌐 Tentando sem especificar idioma`);
        const transcript = await this.getTranscriptForLanguage(videoId);
        if (transcript && transcript.trim()) {
          console.log(`✅ Transcrição obtida sem idioma específico, tamanho: ${transcript.length}`);
          return transcript;
        }
      } catch (error) {
        console.log(`⚠️ Falha sem idioma específico:`, error instanceof Error ? error.message : 'Erro desconhecido');
      }

      console.log(`❌ Nenhuma transcrição encontrada para: ${videoId}`);
      return null;

    } catch (error) {
      console.error(`❌ Erro ao buscar transcrição para ${videoId}:`, error);
      return null;
    }
  }

  private async getTranscriptForLanguage(videoId: string, lang?: string): Promise<string | null> {
    try {
      const client = new TranscriptClient();
      await client.ready;
      
      const options = lang ? { lang } : {};
      const transcriptData = await client.getTranscript(videoId, options);
      
      // Processar diferentes formatos de resposta
      let transcript = '';
      
      if (transcriptData && transcriptData.tracks && transcriptData.tracks.length > 0) {
        const track = transcriptData.tracks[0];
        if (track.transcript && Array.isArray(track.transcript)) {
          transcript = track.transcript.map((item: any) => item.text || item).join(' ');
        } else if (typeof track.transcript === 'string') {
          transcript = track.transcript;
        }
      } else if (transcriptData && transcriptData.transcript) {
        transcript = transcriptData.transcript;
      } else if (transcriptData && Array.isArray(transcriptData)) {
        transcript = transcriptData.map((item: any) => item.text || item).join(' ');
      } else if (typeof transcriptData === 'string') {
        transcript = transcriptData;
      }

      return transcript.trim() || null;
    } catch (error) {
      throw error;
    }
  }

  // Método para verificar se um vídeo tem transcrição disponível
  async hasTranscript(videoId: string): Promise<boolean> {
    try {
      const transcript = await this.getTranscript(videoId);
      return !!transcript;
    } catch (error) {
      return false;
    }
  }

  // Método para obter informações sobre as transcrições disponíveis
  async getAvailableTranscripts(videoId: string): Promise<any[]> {
    try {
      const client = new TranscriptClient();
      await client.ready;
      
      const transcripts = await client.listTranscripts(videoId);
      return transcripts || [];
    } catch (error) {
      console.error(`❌ Erro ao listar transcrições para ${videoId}:`, error);
      return [];
    }
  }
}

export default YouTubeTranscriptService.getInstance(); 