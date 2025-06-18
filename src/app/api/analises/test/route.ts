import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import TranscriptClient from 'youtube-transcript-api';
import mongoose from 'mongoose';

// Inicializar o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// POST - Criar nova análise (versão de teste sem autenticação)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoTitle, channelId, categoryId } = body;

    console.log('Dados recebidos:', { videoId, videoTitle, channelId, categoryId });

    if (!videoId || !videoTitle || !channelId || !categoryId) {
      return NextResponse.json(
        { error: 'videoId, videoTitle, channelId e categoryId são obrigatórios' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se já existe uma análise para este vídeo
    const existingAnalysis = await Analysis.findOne({ videoId });
    if (existingAnalysis) {
      return NextResponse.json({ 
        error: "Análise já existe para este vídeo",
        analysisId: existingAnalysis._id 
      }, { status: 409 });
    }

    // Buscar transcrição do vídeo
    let transcript = '';
    try {
      console.log('🔍 Buscando transcrição para:', videoId);
      const client = new TranscriptClient();
      await client.ready;
      const transcriptData = await client.getTranscript(videoId);
      console.log('📄 Dados da transcrição:', transcriptData);
      
      // Verificar a estrutura da resposta
      if (transcriptData && transcriptData.tracks && transcriptData.tracks.length > 0) {
        // A transcrição está em tracks[0].transcript
        const track = transcriptData.tracks[0];
        if (track.transcript && Array.isArray(track.transcript)) {
          transcript = track.transcript.map((item: any) => item.text || item).join(' ');
        } else if (typeof track.transcript === 'string') {
          transcript = track.transcript;
        }
      } else if (transcriptData && transcriptData.transcript) {
        transcript = transcriptData.transcript;
      } else if (transcriptData && Array.isArray(transcriptData)) {
        // Se for um array, juntar os textos
        transcript = transcriptData.map(item => item.text || item).join(' ');
      } else if (typeof transcriptData === 'string') {
        transcript = transcriptData;
      } else {
        throw new Error('Formato de transcrição não reconhecido');
      }
      
      console.log('✅ Transcrição obtida, tamanho:', transcript.length);
    } catch (error) {
      console.error('❌ Erro ao buscar transcrição:', error);
      return NextResponse.json(
        { error: 'Não foi possível obter a transcrição do vídeo. Verifique se o vídeo tem legendas disponíveis.' },
        { status: 400 }
      );
    }

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: 'Transcrição vazia. O vídeo pode não ter legendas disponíveis.' },
        { status: 400 }
      );
    }

    // Gerar análise com Gemini
    console.log('🤖 Gerando análise com Gemini...');
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
    console.log('✅ Análise gerada pelo Gemini');

    // Extrair resumo e opinião do texto retornado
    const summaryMatch = analysisText.match(/RESUMO:\s*((?:- .*\n?)*)/);
    const opinionMatch = analysisText.match(/OPINIÃO:\s*([\s\S]*)/);

    const summary = summaryMatch 
      ? summaryMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(2))
      : ['Análise não disponível'];

    const opinion = opinionMatch ? opinionMatch[1].trim() : 'Opinião não disponível';

    // Combinar resumo e opinião em um texto único para o campo aiSummary
    const aiSummary = `
## Resumo em Tópicos

### Principais Assuntos Abordados:
${summary.map((item, index) => `- Tópico ${index + 1}: ${item}`).join('\n')}

### Opinião:
${opinion}
`;

    // Criar análise no banco de dados
    console.log('💾 Salvando análise no banco de dados...');
    const analysisData: any = {
      userId: '507f1f77bcf86cd799439011', // ID de teste
      videoId,
      videoTitle,
      channelName: 'Canal de Teste',
      transcription: transcript,
      aiSummary: aiSummary,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Adicionar channelId e categoryId apenas se forem ObjectIds válidos
    if (channelId && channelId !== 'test-channel-id' && mongoose.Types.ObjectId.isValid(channelId)) {
      analysisData.channelId = channelId;
    }
    if (categoryId && categoryId !== 'test-category' && mongoose.Types.ObjectId.isValid(categoryId)) {
      analysisData.categoryId = categoryId;
    }

    const analysis = new Analysis(analysisData);

    await analysis.save();
    console.log('✅ Análise salva com sucesso! ID:', analysis._id);

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis._id,
        videoId,
        channelId,
        categoryId,
        videoTitle,
        summary,
        opinion,
        status: 'completed',
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar análise:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// GET - Listar análises (versão de teste)
export async function GET() {
  try {
    await connectDB();
    
    const analyses = await Analysis.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      analyses,
      total: analyses.length
    });

  } catch (error) {
    console.error("Erro ao listar análises:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 