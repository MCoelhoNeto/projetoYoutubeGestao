import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import User from "@models/User";

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

    // Buscar canal diretamente do banco
    const channel = await Channel.findOne({ _id: params.id, userId: user._id }).lean();
    
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    // Buscar também via findOne normal para comparar
    const channelNormal = await Channel.findOne({ _id: params.id, userId: user._id });

    return NextResponse.json({
      debug: {
        channelId: params.id,
        lean: {
          _id: channel._id,
          title: channel.title,
          listInVideos: channel.listInVideos,
          tipo: typeof channel.listInVideos
        },
        normal: {
          _id: channelNormal._id,
          title: channelNormal.title,
          listInVideos: channelNormal.listInVideos,
          tipo: typeof channelNormal.listInVideos
        }
      }
    });

  } catch (error) {
    console.error("Erro no debug channel:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 