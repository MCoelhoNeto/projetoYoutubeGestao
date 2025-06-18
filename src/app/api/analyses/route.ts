import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";
import Channel from "@models/Channel";
import Category from "@models/Category";

// Função para obter transcrição do YouTube
async function getYouTubeTranscription(videoId: string): Promise<string> {
  try {
    // Aqui você implementaria a lógica para obter a transcrição
    // Por enquanto, vou simular uma transcrição
    // Em produção, você usaria a API do YouTube ou uma biblioteca como youtube-transcript-api
    
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new Error("Não foi possível acessar o vídeo");
    }
    
    // Simulação - em produção você extrairia a transcrição real
    return `Transcrição simulada do vídeo ${videoId}. Este é um exemplo de transcrição que seria extraída automaticamente do YouTube.`;
  } catch (error) {
    console.error("Erro ao obter transcrição:", error);
    throw new Error("Erro ao obter transcrição do vídeo");
  }
}

// Função para analisar com Gemini
async function analyzeWithGemini(transcription: string, videoTitle: string): Promise<string> {
  try {
    // Aqui você implementaria a integração com o Gemini
    // Por enquanto, vou simular uma análise
    
    const prompt = `A partir da transcrição de legenda do vídeo "${videoTitle}", faça um resumo em tópicos abordando tudo o que foi dito no vídeo e emita uma opinião.

Transcrição:
${transcription}

Por favor, forneça:
1. Resumo em tópicos principais
2. Pontos-chave abordados
3. Sua opinião sobre o conteúdo
4. Recomendações ou insights`;

    // Simulação da resposta do Gemini
    const mockResponse = `
## Resumo em Tópicos

### Principais Assuntos Abordados:
- Tópico 1: Descrição do primeiro assunto
- Tópico 2: Descrição do segundo assunto  
- Tópico 3: Descrição do terceiro assunto

### Pontos-Chave:
- Ponto importante 1
- Ponto importante 2
- Ponto importante 3

### Opinião:
Este vídeo apresenta conteúdo relevante sobre [assunto]. A abordagem é didática e bem estruturada, facilitando o entendimento dos conceitos apresentados.

### Recomendações:
- Recomendação 1
- Recomendação 2
- Recomendação 3
`;

    return mockResponse;
  } catch (error) {
    console.error("Erro na análise com Gemini:", error);
    throw new Error("Erro na análise com IA");
  }
}

// POST - Criar nova análise
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, title, channelId, categoryId } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 });
    }

    await connectDB();

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

    // Criar análise inicial
    const analysis = new Analysis({
      userId: user._id,
      videoId,
      channelId: channel._id,
      categoryId,
      videoTitle: title,
      channelName: channel.title,
      transcription: "",
      aiSummary: "",
      status: "processing"
    });

    await analysis.save();

    // Processar análise em background
    processAnalysis(analysis._id, videoId, title).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Análise iniciada com sucesso",
      analysisId: analysis._id
    });

  } catch (error) {
    console.error("Erro ao criar análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
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

    const query: any = { userId: user._id };
    if (status) {
      query.status = status;
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

// Função para processar análise em background
async function processAnalysis(analysisId: string, videoId: string, videoTitle: string) {
  try {
    // Obter transcrição
    const transcription = await getYouTubeTranscription(videoId);
    
    // Analisar com Gemini
    const aiSummary = await analyzeWithGemini(transcription, videoTitle);
    
    // Atualizar análise
    await Analysis.findByIdAndUpdate(analysisId, {
      transcription,
      aiSummary,
      status: "completed",
      updatedAt: new Date()
    });

    console.log(`✅ Análise ${analysisId} concluída com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao processar análise ${analysisId}:`, error);
    
    // Atualizar status de erro
    await Analysis.findByIdAndUpdate(analysisId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
      updatedAt: new Date()
    });
  }
} 