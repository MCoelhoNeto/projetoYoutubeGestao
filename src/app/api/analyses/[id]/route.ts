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