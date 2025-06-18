import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]/authOption";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";
import mongoose from "mongoose";

// GET - Buscar análise específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET - Iniciando busca de análise');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('GET - Usuário não autorizado');
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    console.log('GET - Banco conectado');

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('GET - Usuário não encontrado');
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { id } = await params;
    console.log('GET - Buscando análise com ID:', id);

    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('GET - ID inválido');
      return NextResponse.json({ error: "ID de análise inválido" }, { status: 400 });
    }

    const analysis = await Analysis.findOne({ 
      _id: id, 
      userId: user._id 
    })
    .populate("channelId", "title")
    .populate("categoryId", "name color");

    if (!analysis) {
      console.log('GET - Análise não encontrada');
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    console.log('GET - Análise encontrada:', {
      id: analysis._id,
      notesCount: analysis.notes?.length || 0,
      notes: analysis.notes
    });

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.log("Erro ao buscar análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Refazer análise
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { id } = await params;

    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID de análise inválido" }, { status: 400 });
    }

    const analysis = await Analysis.findOne({ 
      _id: id, 
      userId: user._id 
    });

    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    // Resetar a análise para processamento
    await Analysis.findByIdAndUpdate(id, {
      status: "processing",
      transcription: "",
      aiSummary: "",
      errorMessage: "",
      updatedAt: new Date()
    });

    console.log(`🔄 Análise ${id} resetada para reprocessamento`);

    return NextResponse.json({
      success: true,
      message: "Análise resetada e enfileirada para reprocessamento",
      analysis: {
        id: id,
        status: "processing"
      }
    });

  } catch (error) {
    console.log("Erro ao refazer análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Adicionar nova anotação (update direto)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PATCH - Iniciando requisição');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('PATCH - Usuário não autorizado');
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    console.log('PATCH - Banco conectado');

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('PATCH - Usuário não encontrado');
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { id } = await params;
    console.log('PATCH DEBUG - id:', id, 'userId:', user._id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('PATCH - ID inválido');
      return NextResponse.json({ error: "ID de análise inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { text, type } = body;
    console.log('PATCH - Dados recebidos:', { text, type });

    if (!text || !type) {
      console.log('PATCH - Campos obrigatórios faltando');
      return NextResponse.json({ error: "Campos 'text' e 'type' são obrigatórios" }, { status: 400 });
    }

    const newNote = {
      text,
      type,
      createdAt: new Date()
    };
    console.log('PATCH - Nova nota criada:', newNote);

    // Primeiro, verificar se a análise existe e se tem o campo notes
    const existingAnalysis = await Analysis.findOne({ _id: id, userId: user._id });
    if (!existingAnalysis) {
      console.log('PATCH - Análise não encontrada');
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    console.log('PATCH - Análise encontrada, notes existem:', !!existingAnalysis.notes);

    // Se não tem o campo notes, inicializar com array vazio
    if (!existingAnalysis.notes) {
      console.log('PATCH - Inicializando campo notes');
      await Analysis.updateOne(
        { _id: id, userId: user._id },
        { $set: { notes: [] } }
      );
    }

    // Update direto no MongoDB
    const updateResult = await Analysis.updateOne(
      { _id: id, userId: user._id },
      {
        $push: { notes: newNote },
        $set: { updatedAt: new Date() }
      }
    );
    console.log('PATCH DEBUG - updateOne result:', updateResult);

    if (updateResult.matchedCount === 0) {
      console.log('PATCH - Análise não encontrada');
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    console.log('PATCH - Nota adicionada com sucesso');
    return NextResponse.json({
      success: true,
      message: "Anotação adicionada com sucesso",
      note: newNote
    });

  } catch (error) {
    console.log("Erro ao adicionar anotação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 