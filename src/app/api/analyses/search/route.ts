import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOption";
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("query") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const channelId = searchParams.get("channelId") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Construir filtros
    const filters: any = {};

    // Busca por texto (título, transcrição, resumo da IA)
    if (query.trim()) {
      filters.$or = [
        { videoTitle: { $regex: query, $options: "i" } },
        { transcription: { $regex: query, $options: "i" } },
        { aiSummary: { $regex: query, $options: "i" } },
        { channelName: { $regex: query, $options: "i" } },
      ];
    }

    // Filtro por categoria
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    // Filtro por canal
    if (channelId) {
      filters.channelId = channelId;
    }

    // Filtro por status
    if (status) {
      filters.status = status;
    }

    // Filtro por data
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) {
        filters.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filters.createdAt.$lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    // Calcular skip para paginação
    const skip = (page - 1) * limit;

    // Executar busca com população de relacionamentos
    const analyses = await Analysis.find(filters)
      .populate("channelId", "title")
      .populate("categoryId", "name color")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total de documentos para paginação
    const total = await Analysis.countDocuments(filters);
    const pages = Math.ceil(total / limit);

    // Formatar dados para resposta
    const formattedAnalyses = analyses.map((analysis: any) => ({
      _id: analysis._id,
      videoId: analysis.videoId,
      videoTitle: analysis.videoTitle,
      channelName: analysis.channelName,
      transcription: analysis.transcription,
      aiSummary: analysis.aiSummary,
      status: analysis.status,
      errorMessage: analysis.errorMessage,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      channelId: analysis.channelId,
      categoryId: analysis.categoryId,
    }));

    return NextResponse.json({
      success: true,
      analyses: formattedAnalyses,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Erro na busca avançada:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 