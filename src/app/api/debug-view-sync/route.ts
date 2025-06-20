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

    // Buscar dados via API normal (como a view faz)
    const channelsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/channels`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    const channelsData = await channelsResponse.json();

    // Buscar dados diretamente do banco
    const channelsFromDB = await Channel.find({ userId: user._id });
    const categoriesFromDB = await Category.find({ userId: user._id });

    // Comparar valores
    const comparison = channelsFromDB.map(channelDB => {
      const channelAPI = channelsData.channels?.find((c: any) => c._id === channelDB._id.toString());
      return {
        _id: channelDB._id.toString(),
        title: channelDB.title,
        dbValue: channelDB.listInVideos,
        apiValue: channelAPI?.listInVideos,
        match: channelDB.listInVideos === channelAPI?.listInVideos,
        dbType: typeof channelDB.listInVideos,
        apiType: typeof channelAPI?.listInVideos
      };
    });

    return NextResponse.json({
      totalChannels: channelsFromDB.length,
      totalCategories: categoriesFromDB.length,
      comparison,
      sampleChannelDB: channelsFromDB[0] ? {
        _id: channelsFromDB[0]._id.toString(),
        title: channelsFromDB[0].title,
        listInVideos: channelsFromDB[0].listInVideos,
        tipo: typeof channelsFromDB[0].listInVideos
      } : null,
      sampleCategoryDB: categoriesFromDB[0] ? {
        _id: categoriesFromDB[0]._id.toString(),
        name: categoriesFromDB[0].name,
        listInVideos: categoriesFromDB[0].listInVideos,
        tipo: typeof categoriesFromDB[0].listInVideos
      } : null
    });

  } catch (error) {
    console.error("Erro no debug view sync:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 