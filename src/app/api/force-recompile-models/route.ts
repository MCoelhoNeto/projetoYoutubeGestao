import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log('=== FORÇANDO RECOMPILAÇÃO DOS MODELOS ===');

    await connectDB();

    // Deletar modelos do cache do Mongoose
    if (mongoose.models.Channel) {
      console.log('Deletando modelo Channel do cache');
      delete mongoose.models.Channel;
    }

    if (mongoose.models.Category) {
      console.log('Deletando modelo Category do cache');
      delete mongoose.models.Category;
    }

    if (mongoose.models.User) {
      console.log('Deletando modelo User do cache');
      delete mongoose.models.User;
    }

    // Recarregar os modelos
    console.log('Recarregando modelos...');
    
    // Recarregar Channel
    const Channel = require('@models/Channel').default;
    console.log('Modelo Channel recarregado');
    
    // Recarregar Category
    const Category = require('@models/Category').default;
    console.log('Modelo Category recarregado');
    
    // Recarregar User
    const User = require('@models/User').default;
    console.log('Modelo User recarregado');

    // Testar se os campos estão sendo reconhecidos
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Testar Channel
    const testChannel = await Channel.findOne({ userId: user._id });
    console.log('Teste Channel após recompilação:', {
      _id: testChannel?._id?.toString(),
      title: testChannel?.title,
      hasListInVideos: testChannel ? 'listInVideos' in testChannel : false,
      listInVideos: testChannel?.listInVideos,
      tipo: typeof testChannel?.listInVideos,
      campos: testChannel ? Object.keys(testChannel.toObject()) : []
    });

    // Testar Category
    const testCategory = await Category.findOne({ userId: user._id });
    console.log('Teste Category após recompilação:', {
      _id: testCategory?._id?.toString(),
      name: testCategory?.name,
      hasListInVideos: testCategory ? 'listInVideos' in testCategory : false,
      listInVideos: testCategory?.listInVideos,
      tipo: typeof testCategory?.listInVideos,
      campos: testCategory ? Object.keys(testCategory.toObject()) : []
    });

    return NextResponse.json({
      success: true,
      message: "Modelos recompilados com sucesso!",
      testChannel: testChannel ? {
        _id: testChannel._id.toString(),
        title: testChannel.title,
        hasListInVideos: 'listInVideos' in testChannel,
        listInVideos: testChannel.listInVideos,
        tipo: typeof testChannel.listInVideos,
        campos: Object.keys(testChannel.toObject())
      } : null,
      testCategory: testCategory ? {
        _id: testCategory._id.toString(),
        name: testCategory.name,
        hasListInVideos: 'listInVideos' in testCategory,
        listInVideos: testCategory.listInVideos,
        tipo: typeof testCategory.listInVideos,
        campos: Object.keys(testCategory.toObject())
      } : null
    });

  } catch (error) {
    console.error("Erro ao recompilar modelos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 