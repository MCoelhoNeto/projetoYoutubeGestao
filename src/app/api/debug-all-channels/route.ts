import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import Category from "@models/Category";
import User from "@models/User";

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

    // Buscar todos os canais
    const channels = await Channel.find({ userId: user._id }).lean();
    const categories = await Category.find({ userId: user._id }).lean();

    // Verificar campos de cada canal
    const channelsDebug = channels.map((channel: any) => ({
      _id: channel._id.toString(),
      title: channel.title,
      hasListInVideos: 'listInVideos' in channel,
      listInVideos: channel.listInVideos,
      tipo: typeof channel.listInVideos,
      campos: Object.keys(channel)
    }));

    // Verificar campos de cada categoria
    const categoriesDebug = categories.map((category: any) => ({
      _id: category._id.toString(),
      name: category.name,
      hasListInVideos: 'listInVideos' in category,
      listInVideos: category.listInVideos,
      tipo: typeof category.listInVideos,
      campos: Object.keys(category)
    }));

    return NextResponse.json({
      totalCanais: channels.length,
      totalCategorias: categories.length,
      canais: channelsDebug,
      categorias: categoriesDebug
    });

  } catch (error) {
    console.error("Erro no debug all:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 