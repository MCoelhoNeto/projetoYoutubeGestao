import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import User from "@models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, newValue } = body;

    console.log('=== DEBUG TOGGLE TEST ===');
    console.log('Channel ID:', channelId);
    console.log('Novo valor:', newValue);
    console.log('Tipo do novo valor:', typeof newValue);

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Converter string para ObjectId
    const objectId = new mongoose.Types.ObjectId(channelId);
    console.log('ObjectId convertido:', objectId);

    // Usar a coleção diretamente
    const db = Channel.db;
    const channelsCollection = db.collection('channels');

    // Buscar o canal antes da atualização
    const channelBefore = await channelsCollection.findOne({ _id: objectId, userId: user._id });
    if (!channelBefore) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    console.log('Canal ANTES da atualização (RAW):', {
      _id: channelBefore._id.toString(),
      title: channelBefore.title,
      listInVideos: channelBefore.listInVideos,
      tipo: typeof channelBefore.listInVideos,
      campos: Object.keys(channelBefore)
    });

    // Atualizar usando updateOne diretamente na coleção
    const updateResult = await channelsCollection.updateOne(
      { _id: objectId, userId: user._id },
      { 
        $set: { 
          listInVideos: newValue,
          updatedAt: new Date()
        }
      }
    );

    console.log('Resultado do updateOne:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount
    });

    // Buscar novamente para confirmar
    const channelAfter = await channelsCollection.findOne({ _id: objectId, userId: user._id });
    if (!channelAfter) {
      return NextResponse.json({ error: "Erro: canal não encontrado após atualização" }, { status: 500 });
    }
    
    console.log('Canal DEPOIS da atualização (RAW):', {
      _id: channelAfter._id.toString(),
      title: channelAfter.title,
      listInVideos: channelAfter.listInVideos,
      tipo: typeof channelAfter.listInVideos
    });

    // Testar também com o modelo Mongoose
    const channelModel = await Channel.findOne({ _id: objectId, userId: user._id });
    if (!channelModel) {
      return NextResponse.json({ error: "Erro: canal não encontrado via modelo" }, { status: 500 });
    }
    
    console.log('Canal via MODELO Mongoose:', {
      _id: channelModel._id.toString(),
      title: channelModel.title,
      listInVideos: channelModel.listInVideos,
      tipo: typeof channelModel.listInVideos
    });

    return NextResponse.json({
      success: true,
      message: "Toggle testado com sucesso",
      updateResult: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      },
      before: {
        listInVideos: channelBefore.listInVideos,
        tipo: typeof channelBefore.listInVideos
      },
      after: {
        listInVideos: channelAfter.listInVideos,
        tipo: typeof channelAfter.listInVideos
      },
      model: {
        listInVideos: channelModel.listInVideos,
        tipo: typeof channelModel.listInVideos
      }
    });

  } catch (error) {
    console.error("Erro no debug toggle test:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 