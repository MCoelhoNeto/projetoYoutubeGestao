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

    // Buscar dados brutos do MongoDB
    const db = Channel.db;
    const channelsCollection = db.collection('channels');
    const categoriesCollection = db.collection('categories');

    // Buscar documentos brutos
    const rawChannels = await channelsCollection.find({ userId: user._id }).toArray();
    const rawCategories = await categoriesCollection.find({ userId: user._id }).toArray();

    // Verificar campos de cada canal
    const channelsDebug = rawChannels.map((channel: any) => ({
      _id: channel._id.toString(),
      title: channel.title,
      hasListInVideos: 'listInVideos' in channel,
      listInVideos: channel.listInVideos,
      tipo: typeof channel.listInVideos,
      campos: Object.keys(channel),
      rawData: channel
    }));

    // Verificar campos de cada categoria
    const categoriesDebug = rawCategories.map((category: any) => ({
      _id: category._id.toString(),
      name: category.name,
      hasListInVideos: 'listInVideos' in category,
      listInVideos: category.listInVideos,
      tipo: typeof category.listInVideos,
      campos: Object.keys(category),
      rawData: category
    }));

    return NextResponse.json({
      totalCanais: rawChannels.length,
      totalCategorias: rawCategories.length,
      canais: channelsDebug.slice(0, 3), // Mostrar apenas os primeiros 3
      categorias: categoriesDebug.slice(0, 3), // Mostrar apenas as primeiras 3
      sampleChannel: rawChannels[0] || null,
      sampleCategory: rawCategories[0] || null
    });

  } catch (error) {
    console.error("Erro no debug raw:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 