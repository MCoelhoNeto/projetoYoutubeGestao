import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import TranscriptClient from 'youtube-transcript-api';

// Inicializar o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface WorkerConfig {
  interval: number; // Intervalo em ms entre verificações
  maxConcurrent: number; // Máximo de análises simultâneas
  enabled: boolean;
}

class AnalysisWorker {
  private isRunning = false;
  private config: WorkerConfig;
  private processingCount = 0;

  constructor(config: WorkerConfig = { interval: 10000, maxConcurrent: 3, enabled: true }) {
    this.config = config;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Worker já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Iniciando Analysis Worker...');
    
    await this.connect();
    this.runLoop();
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 Parando Analysis Worker...');
  }

  private async connect() {
    try {
      await connectDB();
      console.log('✅ Worker conectado ao banco de dados');
    } catch (error) {
      console.error('❌ Erro ao conectar worker ao banco:', error);
      throw error;
    }
  }

  private async runLoop() {
    while (this.isRunning) {
      try {
        await this.processPendingAnalyses();
        await this.sleep(this.config.interval);
      } catch (error) {
        console.error('❌ Erro no loop do worker:', error);
        await this.sleep(5000); // Espera 5s em caso de erro
      }
    }
  }

  private async processPendingAnalyses() {
    if (this.processingCount >= this.config.maxConcurrent) {
      return; // Limite de concorrência atingido
    }

    // Buscar análises pendentes
    const pendingAnalyses = await Analysis.find({ 
      status: "processing" 
    }).limit(this.config.maxConcurrent - this.processingCount);

    if (pendingAnalyses.length === 0) {
      return; // Nenhuma análise pendente
    }

    console.log(`🔍 Encontradas ${pendingAnalyses.length} análises pendentes`);

    // Processar análises em paralelo
    const promises = pendingAnalyses.map(analysis => this.processAnalysis(analysis));
    await Promise.allSettled(promises);
  }

  private async processAnalysis(analysis: any) {
    this.processingCount++;
    console.log(`🔄 Processando análise: ${analysis.videoTitle} (${analysis.videoId})`);

    try {
      // Buscar transcrição
      const transcript = await this.getTranscript(analysis.videoId);
      
      if (!transcript) {
        await this.updateAnalysisError(analysis._id, "Não foi possível obter a transcrição do vídeo");
        return;
      }

      // Gerar análise com IA
      const aiSummary = await this.generateAnalysis(analysis.videoTitle, transcript);
      
      // Atualizar análise com sucesso
      await this.updateAnalysisSuccess(analysis._id, transcript, aiSummary);
      
      console.log(`✅ Análise concluída: ${analysis.videoTitle}`);

    } catch (error) {
      console.error(`❌ Erro ao processar análise ${analysis.videoId}:`, error);
      await this.updateAnalysisError(analysis._id, error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      this.processingCount--;
    }
  }

  private async getTranscript(videoId: string): Promise<string | null> {
    try {
      console.log(`🔍 Buscando transcrição para: ${videoId}`);
      const client = new TranscriptClient();
      await client.ready;
      const transcriptData = await client.getTranscript(videoId);
      
      // Processar dados da transcrição
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
        transcript = transcriptData.map(item => item.text || item).join(' ');
      } else if (typeof transcriptData === 'string') {
        transcript = transcriptData;
      }

      if (!transcript.trim()) {
        return null;
      }

      console.log(`✅ Transcrição obtida, tamanho: ${transcript.length}`);
      return transcript;

    } catch (error) {
      console.error(`❌ Erro ao buscar transcrição para ${videoId}:`, error);
      return null;
    }
  }

  private async generateAnalysis(videoTitle: string, transcript: string): Promise<string> {
    try {
      console.log(`🤖 Gerando análise com Gemini para: ${videoTitle}`);
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Analise a transcrição do vídeo "${videoTitle}" de forma completa e detalhada. Forneça uma análise estruturada que inclua:

## INSTRUÇÕES ESPECÍFICAS:

1. **RESUMO GERAL (1-2 parágrafos)**:
   - Síntese completa de tudo o que foi abordado no vídeo
   - Contexto e objetivo principal do conteúdo
   - Principais conclusões ou takeaways

2. **TÓPICOS DETALHADOS (sem limite)**:
   - Liste TODOS os assuntos abordados no vídeo
   - Cada tópico deve ser específico e informativo
   - Inclua conceitos, tecnologias, ferramentas, metodologias mencionadas
   - Não limite a quantidade de tópicos - seja completo

3. **OPINIÃO ESPECIALIZADA**:
   - Se o vídeo for sobre tecnologia da informação, analise como um especialista em TI
   - Avalie a qualidade técnica, precisão das informações
   - Identifique pontos fortes, fracos e oportunidades de melhoria
   - Sugira aplicações práticas ou próximos passos
   - Máximo 3 parágrafos com foco técnico

## TRANSCRIÇÃO DO VÍDEO:
${transcript}

## FORMATO DE RESPOSTA:
Responda em português brasileiro e formate exatamente assim:

**RESUMO GERAL:**
[1-2 parágrafos com resumo completo]

**TÓPICOS ABORDADOS:**
- [Lista completa de todos os tópicos, sem limite]
- [Seja específico e detalhado]
- [Inclua conceitos técnicos, ferramentas, metodologias]

**OPINIÃO ESPECIALIZADA:**
[3 parágrafos com análise técnica e recomendações]
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Extrair seções usando regex mais robusto
      const summaryMatch = analysisText.match(/\*\*RESUMO GERAL:\*\*\s*([\s\S]*?)(?=\*\*TÓPICOS ABORDADOS:\*\*)/i);
      const topicsMatch = analysisText.match(/\*\*TÓPICOS ABORDADOS:\*\*\s*([\s\S]*?)(?=\*\*OPINIÃO ESPECIALIZADA:\*\*)/i);
      const opinionMatch = analysisText.match(/\*\*OPINIÃO ESPECIALIZADA:\*\*\s*([\s\S]*)/i);

      const summary = summaryMatch ? summaryMatch[1].trim() : 'Resumo não disponível';
      const topics = topicsMatch 
        ? topicsMatch[1].split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.trim().substring(2))
            .filter(topic => topic.length > 0)
        : ['Tópicos não disponíveis'];
      const opinion = opinionMatch ? opinionMatch[1].trim() : 'Opinião não disponível';

      // Formatar a análise final
      const aiSummary = `
## 📋 RESUMO GERAL

${summary}

## 🎯 TÓPICOS ABORDADOS

${topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

## 💡 OPINIÃO ESPECIALIZADA

${opinion}
`;

      console.log(`✅ Análise completa gerada pelo Gemini`);
      return aiSummary;

    } catch (error) {
      console.error(`❌ Erro na análise com Gemini:`, error);
      throw error;
    }
  }

  private async updateAnalysisSuccess(analysisId: string, transcript: string, aiSummary: string) {
    await Analysis.findByIdAndUpdate(analysisId, {
      transcription: transcript,
      aiSummary: aiSummary,
      status: 'completed',
      updatedAt: new Date()
    });
  }

  private async updateAnalysisError(analysisId: string, errorMessage: string) {
    await Analysis.findByIdAndUpdate(analysisId, {
      status: "error",
      errorMessage: errorMessage,
      updatedAt: new Date()
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos públicos para controle
  getStatus() {
    return {
      isRunning: this.isRunning,
      processingCount: this.processingCount,
      maxConcurrent: this.config.maxConcurrent,
      config: this.config
    };
  }

  async getPendingCount() {
    return await Analysis.countDocuments({ status: "processing" });
  }
}

// Instância singleton do worker
let workerInstance: AnalysisWorker | null = null;

export function getAnalysisWorker(): AnalysisWorker {
  if (!workerInstance) {
    workerInstance = new AnalysisWorker();
  }
  return workerInstance;
}

export default AnalysisWorker; 