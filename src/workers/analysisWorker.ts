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
Analise a transcrição do vídeo "${videoTitle}" e forneça:

1. **Resumo em tópicos** (máximo 5 tópicos principais):
   - Extraia os pontos mais importantes
   - Use linguagem clara e objetiva
   - Cada tópico deve ter no máximo 2 linhas

2. **Opinião sobre o conteúdo**:
   - Avalie a qualidade e relevância do conteúdo
   - Identifique pontos fortes e fracos
   - Sugira melhorias se aplicável
   - Máximo 3 parágrafos

Transcrição do vídeo:
${transcript}

Responda em português brasileiro e formate a resposta assim:
RESUMO:
- Tópico 1
- Tópico 2
- Tópico 3
- Tópico 4
- Tópico 5

OPINIÃO:
[Seu texto de opinião aqui]
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();

      // Extrair resumo e opinião
      const summaryMatch = analysisText.match(/RESUMO:\s*((?:- .*\n?)*)/);
      const opinionMatch = analysisText.match(/OPINIÃO:\s*([\s\S]*)/);

      const summary = summaryMatch 
        ? summaryMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(2))
        : ['Análise não disponível'];

      const opinion = opinionMatch ? opinionMatch[1].trim() : 'Opinião não disponível';

      // Combinar em um texto único
      const aiSummary = `
## Resumo em Tópicos

### Principais Assuntos Abordados:
${summary.map((item, index) => `- Tópico ${index + 1}: ${item}`).join('\n')}

### Opinião:
${opinion}
`;

      console.log(`✅ Análise gerada pelo Gemini`);
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