import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";

// GET - Buscar análise específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const analysis = await Analysis.findOne({ 
      _id: params.id, 
      userId: user._id 
    })
    .populate("channelId", "title")
    .populate("categoryId", "name color");

    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error("Erro ao buscar análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Refazer análise
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const analysis = await Analysis.findOne({ 
      _id: params.id, 
      userId: user._id 
    });

    if (!analysis) {
      return NextResponse.json({ error: "Análise não encontrada" }, { status: 404 });
    }

    // Resetar a análise para processamento
    await Analysis.findByIdAndUpdate(params.id, {
      status: "processing",
      transcription: "",
      aiSummary: "",
      errorMessage: "",
      updatedAt: new Date()
    });

    console.log(`🔄 Análise ${params.id} resetada para reprocessamento`);

    return NextResponse.json({
      success: true,
      message: "Análise resetada e enfileirada para reprocessamento",
      analysis: {
        id: params.id,
        status: "processing"
      }
    });

  } catch (error) {
    console.error("Erro ao refazer análise:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 