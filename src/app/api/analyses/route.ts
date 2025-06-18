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

// POST - Criar nova análise (agora assíncrona)
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
      console.log('🔍 Buscando categoria:', categoryId);
      // Primeiro tentar buscar por ID
      if (categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('🔍 Buscando categoria por ID:', categoryId);
        category = await Category.findOne({ _id: categoryId, userId: user._id });
      }
      // Se não encontrar por ID, buscar por nome
      if (!category) {
        console.log('🔍 Buscando categoria por nome:', categoryId);
        category = await Category.findOne({ name: categoryId, userId: user._id });
      }
      if (category) {
        console.log('✅ Categoria encontrada:', category.name);
      } else {
        console.log('⚠️ Categoria não encontrada para:', categoryId);
      }
    }

    // Criar análise inicial com status "processing"
    console.log('💾 Criando registro inicial da análise...');
    const analysisData: any = {
      userId: user._id,
      videoId,
      channelId: channel._id,
      videoTitle,
      channelName: channel.title,
      transcription: "",
      aiSummary: "",
      status: "processing",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Adicionar categoryId apenas se a categoria for encontrada
    if (category) {
      analysisData.categoryId = category._id;
    }

    console.log('📄 Dados da análise a serem salvos:', JSON.stringify(analysisData, null, 2));

    const analysis = new Analysis(analysisData);

    try {
      await analysis.save();
      console.log('✅ Registro inicial criado com ID:', analysis._id);
    } catch (saveError) {
      console.error('❌ Erro ao salvar análise:', saveError);
      console.error('❌ Dados que causaram erro:', JSON.stringify(analysisData, null, 2));
      throw saveError;
    }

    // Retornar sucesso imediatamente - o worker processará em background
    console.log('✅ Análise enfileirada para processamento');

    return NextResponse.json({
      success: true,
      message: "Análise enfileirada para processamento",
      analysis: {
        id: analysis._id,
        videoId,
        videoTitle,
        status: 'processing',
        createdAt: analysis.createdAt
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