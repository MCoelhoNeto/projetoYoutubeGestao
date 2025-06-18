// /src/app/api/analises/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";
import Channel from "@models/Channel";
import Category from "@models/Category";
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import TranscriptClient from 'youtube-transcript-api';

// Inicializar o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// POST - Criar nova análise
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, videoTitle, channelId, categoryId } = body;

    console.log('📝 Dados recebidos:', { videoId, videoTitle, channelId, categoryId });

    if (!videoId || !videoTitle || !channelId || !categoryId) {
      return NextResponse.json(
        { error: 'videoId, videoTitle, channelId e categoryId são obrigatórios' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('✅ Conectado ao banco de dados');

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se já existe uma análise para este vídeo
    const existingAnalysis = await Analysis.findOne({ 
      userId: user._id, 
      videoId 
    });

    if (existingAnalysis) {
      return NextResponse.json({ 
        error: "Análise já existe para este vídeo",
        analysisId: existingAnalysis._id 
      }, { status: 409 });
    }

    // Buscar informações do canal
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    // Buscar categoria se fornecida
    let category = null;
    if (categoryId) {
      category = await Category.findOne({ name: categoryId });
    }

    // Criar análise inicial com status "processing"
    console.log('💾 Criando registro inicial da análise...');
    const analysisData: any = {
      userId: user._id,
      videoId,
      channelId: channel._id,
      videoTitle,
      channelName: channel.title,
      status: "processing",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Adicionar categoryId apenas se a categoria for encontrada
    if (category) {
      analysisData.categoryId = category._id;
    }

    const analysis = new Analysis(analysisData);

    await analysis.save();
    console.log('✅ Registro inicial criado com ID:', analysis._id);

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
      
      // Atualizar análise com erro
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Não foi possível obter a transcrição do vídeo. Verifique se o vídeo tem legendas disponíveis.",
        updatedAt: new Date()
      });

      return NextResponse.json(
        { error: 'Não foi possível obter a transcrição do vídeo. Verifique se o vídeo tem legendas disponíveis.' },
        { status: 400 }
      );
    }

    if (!transcript.trim()) {
      // Atualizar análise com erro
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Transcrição vazia. O vídeo pode não ter legendas disponíveis.",
        updatedAt: new Date()
      });

      return NextResponse.json(
        { error: 'Transcrição vazia. O vídeo pode não ter legendas disponíveis.' },
        { status: 400 }
      );
    }

    // Gerar análise com Gemini
    console.log('🤖 Gerando análise com Gemini...');
    try {
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

      // Atualizar análise com os resultados
      console.log('💾 Atualizando análise com resultados...');
      await Analysis.findByIdAndUpdate(analysis._id, {
        transcription: transcript,
        aiSummary: aiSummary,
        status: 'completed',
        updatedAt: new Date()
      });

      console.log('✅ Análise concluída com sucesso!');

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
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Erro na análise com Gemini:', error);
      
      // Atualizar análise com erro
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: "error",
        errorMessage: "Erro na análise com IA: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        updatedAt: new Date()
      });

      return NextResponse.json(
        { error: 'Erro na análise com IA' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Erro ao criar análise:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// GET - Listar análises
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const channelId = searchParams.get("channelId");
    const categoryId = searchParams.get("categoryId");

    const query: any = { userId: user._id };
    if (status) {
      query.status = status;
    }
    if (channelId) {
      query.channelId = channelId;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const analyses = await Analysis.find(query)
      .populate("channelId", "title")
      .populate("categoryId", "name color")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Analysis.countDocuments(query);

    return NextResponse.json({
      success: true,
      analyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Erro ao listar análises:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}