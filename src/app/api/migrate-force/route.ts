import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import Category from "@models/Category";
import User from "@models/User";

export async function POST(request: NextRequest) {
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

    // Forçar atualização de TODOS os canais
    const channelsResult = await Channel.updateMany(
      { userId: user._id },
      { 
        $set: { listInVideos: true }
      }
    );

    // Forçar atualização de TODAS as categorias
    const categoriesResult = await Category.updateMany(
      { userId: user._id },
      { 
        $set: { listInVideos: true }
      }
    );

    console.log('Migração FORCE concluída:', {
      canaisAtualizados: channelsResult.modifiedCount,
      categoriasAtualizadas: categoriesResult.modifiedCount
    });

    // Verificar documentos após migração
    const channelsAfter = await Channel.find({ userId: user._id });
    const categoriesAfter = await Category.find({ userId: user._id });

    const channelsWithField = channelsAfter.filter(ch => ch.listInVideos !== undefined);
    const categoriesWithField = categoriesAfter.filter(cat => cat.listInVideos !== undefined);

    return NextResponse.json({
      success: true,
      message: "Migração FORCE concluída",
      canaisAtualizados: channelsResult.modifiedCount,
      categoriasAtualizadas: categoriesResult.modifiedCount,
      totalCanais: channelsAfter.length,
      canaisComCampo: channelsWithField.length,
      totalCategorias: categoriesAfter.length,
      categoriasComCampo: categoriesWithField.length
    });

  } catch (error) {
    console.error("Erro na migração FORCE:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 