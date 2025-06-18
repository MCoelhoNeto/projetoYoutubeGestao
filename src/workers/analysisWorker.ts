import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import { GoogleGenerativeAI } from '@google/generative-ai';
import YouTubeTranscriptService from "@lib/youtube-transcript";

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
      console.log("⚠️ Worker já está rodando");
      return;
    }

    console.log("🚀 Iniciando Analysis Worker...");
    this.isRunning = true;
    await this.connect();
    this.runLoop();
  }

  async stop() {
    console.log("🛑 Parando Analysis Worker...");
    this.isRunning = false;
  }

  private async connect() {
    await connectDB();
    console.log("✅ Conectado ao MongoDB");
  }

  private async runLoop() {
    while (this.isRunning) {
      try {
        await this.processPendingAnalyses();
        await this.sleep(this.config.interval);
      } catch (error) {
        console.error("❌ Erro no loop do worker:", error);
        await this.sleep(5000); // Esperar 5s em caso de erro
      }
    }
  }

  private async processPendingAnalyses() {
    if (this.processingCount >= this.config.maxConcurrent) {
      return;
    }

    const pendingAnalyses = await Analysis.find({ status: "processing" })
      .limit(this.config.maxConcurrent - this.processingCount)
      .sort({ createdAt: 1 });

    for (const analysis of pendingAnalyses) {
      if (this.processingCount >= this.config.maxConcurrent) break;
      this.processAnalysis(analysis);
    }
  }

  private async processAnalysis(analysis: any) {
    this.processingCount++;
    console.log(`🔄 Processando análise: ${analysis.videoTitle} (${analysis.videoId})`);

    try {
      // Buscar transcrição com múltiplos métodos
      const transcript = await this.getTranscript(analysis.videoId);
      
      if (!transcript) {
        await this.updateAnalysisError(analysis._id, "Não foi possível obter a transcrição do vídeo. Verifique se o vídeo tem legendas disponíveis.");
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
      
      // Usar o novo serviço simplificado
      const transcript = await YouTubeTranscriptService.getTranscript(videoId);
      
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

2. **TÓPICOS DETALHADOS COM EXPLICAÇÕES**:
   - Liste TODOS os assuntos abordados no vídeo
   - Para cada tópico, forneça uma explicação detalhada (2-4 linhas)
   - Inclua conceitos, tecnologias, ferramentas, metodologias mencionadas
   - Explique o contexto e importância de cada tópico
   - Não limite a quantidade de tópicos - seja completo
   - Use linguagem técnica quando apropriado

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
1. [Nome do tópico]: [Explicação detalhada de 2-4 linhas sobre o que foi abordado, conceitos explicados, importância do tópico]
2. [Nome do tópico]: [Explicação detalhada de 2-4 linhas sobre o que foi abordado, conceitos explicados, importância do tópico]
3. [Nome do tópico]: [Explicação detalhada de 2-4 linhas sobre o que foi abordado, conceitos explicados, importância do tópico]
[Continue listando todos os tópicos com explicações detalhadas]

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
            .filter(line => line.trim().match(/^\d+\./))
            .map(line => line.trim())
            .filter(topic => topic.length > 0)
        : ['Tópicos não disponíveis'];
      const opinion = opinionMatch ? opinionMatch[1].trim() : 'Opinião não disponível';

      // Formatar a análise final
      const aiSummary = `
## 📋 RESUMO GERAL

${summary}

## 🎯 TÓPICOS ABORDADOS

${topics.join('\n\n')}

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