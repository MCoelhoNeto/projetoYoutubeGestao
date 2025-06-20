import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";
import User from "@models/User";

// GET - Buscar videoIds que já foram analisados
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
    const videoIds = searchParams.get("videoIds");
    const status = searchParams.get("status") || "completed";

    // Se videoIds for fornecido, buscar apenas esses vídeos
    if (videoIds) {
      const videoIdArray = videoIds.split(',').map(id => id.trim());
      
      const analyses = await Analysis.find({
        userId: user._id,
        videoId: { $in: videoIdArray },
        status: status
      }).select('videoId status');

      const videoIdsAnalisados = analyses.map(a => a.videoId);

      return NextResponse.json({
        success: true,
        videoIds: videoIdsAnalisados,
        count: videoIdsAnalisados.length
      });
    }

    // Se não fornecido videoIds, retornar todos os videoIds analisados
    const analyses = await Analysis.find({
      userId: user._id,
      status: status
    }).select('videoId');

    const videoIdsAnalisados = analyses.map(a => a.videoId);

    return NextResponse.json({
      success: true,
      videoIds: videoIdsAnalisados,
      count: videoIdsAnalisados.length
    });

  } catch (error) {
    console.error("Erro ao buscar análises por videoId:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 