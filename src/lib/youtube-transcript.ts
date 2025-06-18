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

  async getTranscript(videoId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando transcrição para: ${videoId}`);
      
      // Primeiro, verificar se o vídeo existe e tem transcrições
      const availableTranscripts = await this.getAvailableTranscripts(videoId);
      console.log(`📋 Transcrições disponíveis:`, availableTranscripts);
      
      if (!availableTranscripts || availableTranscripts.length === 0) {
        console.log(`❌ Nenhuma transcrição disponível para: ${videoId}`);
        return null;
      }

      // Tentar obter a primeira transcrição disponível
      const firstTranscript = availableTranscripts[0];
      console.log(`🎯 Tentando transcrição:`, firstTranscript);
      
      const transcript = await this.getTranscriptForLanguage(videoId, firstTranscript.languageCode);
      
      if (transcript && transcript.trim()) {
        console.log(`✅ Transcrição obtida, tamanho: ${transcript.length}`);
        return transcript;
      }

      // Se a primeira falhou, tentar outras
      for (const transcriptInfo of availableTranscripts.slice(1)) {
        try {
          console.log(`🔄 Tentando transcrição alternativa: ${transcriptInfo.languageCode}`);
          const altTranscript = await this.getTranscriptForLanguage(videoId, transcriptInfo.languageCode);
          if (altTranscript && altTranscript.trim()) {
            console.log(`✅ Transcrição alternativa obtida, tamanho: ${altTranscript.length}`);
            return altTranscript;
          }
        } catch (error) {
          console.log(`⚠️ Falha na transcrição alternativa ${transcriptInfo.languageCode}:`, error);
          continue;
        }
      }

      console.log(`❌ Nenhuma transcrição válida encontrada para: ${videoId}`);
      return null;

    } catch (error) {
      console.error(`❌ Erro ao buscar transcrição para ${videoId}:`, error);
      return null;
    }
  }

  private async getTranscriptForLanguage(videoId: string, lang?: string): Promise<string | null> {
    try {
      console.log(`🌐 Inicializando cliente de transcrição para ${videoId} (${lang || 'idioma padrão'})`);
      
      const client = new TranscriptClient();
      await client.ready;
      
      const options = lang ? { lang } : {};
      console.log(`📡 Fazendo requisição com opções:`, options);
      
      const transcriptData = await client.getTranscript(videoId, options);
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
      console.error(`❌ Erro no getTranscriptForLanguage:`, error);
      throw error;
    }
  }

  // Método para verificar se um vídeo tem transcrição disponível
  async hasTranscript(videoId: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando se ${videoId} tem transcrição`);
      const availableTranscripts = await this.getAvailableTranscripts(videoId);
      const hasTranscript = availableTranscripts && availableTranscripts.length > 0;
      console.log(`📊 Resultado da verificação: ${hasTranscript} (${availableTranscripts?.length || 0} transcrições)`);
      return hasTranscript;
    } catch (error) {
      console.error(`❌ Erro ao verificar transcrição para ${videoId}:`, error);
      return false;
    }
  }

  // Método para obter informações sobre as transcrições disponíveis
  async getAvailableTranscripts(videoId: string): Promise<any[]> {
    try {
      console.log(`📋 Listando transcrições disponíveis para: ${videoId}`);
      
      const client = new TranscriptClient();
      await client.ready;
      
      const transcripts = await client.listTranscripts(videoId);
      console.log(`📊 Transcrições encontradas:`, transcripts);
      
      if (!transcripts) {
        console.log(`⚠️ Nenhuma transcrição retornada para: ${videoId}`);
        return [];
      }
      
      return Array.isArray(transcripts) ? transcripts : [];
      
    } catch (error) {
      console.error(`❌ Erro ao listar transcrições para ${videoId}:`, error);
      return [];
    }
  }
}

export default YouTubeTranscriptService.getInstance(); 