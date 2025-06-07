import connectDB from "@/lib/mongodb";
import Channel from "@/models/Channel";
import { getServerSession } from "next-auth";
import { authOptions } from "@authOptions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    await connectDB();

    // Verificar se já existe canal do usuário com mesmo youtubeChannelId
    const canalExistente = await Channel.findOne({
      youtubeChannelId: body.youtubeChannelId,
      userId: userId,
    });

    if (canalExistente) {
      return NextResponse.json(
        { error: "Canal já cadastrado por este usuário" },
        { status: 400 }
      );
    }

    const novoCanal = await Channel.create({
      ...body,
      userId,
    });

    return NextResponse.json({ success: true, channel: novoCanal });
  } catch (err) {
    console.error("Erro ao salvar canal:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
