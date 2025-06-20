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

    // Usar a coleção diretamente para forçar a atualização
    const db = Channel.db;
    const channelsCollection = db.collection('channels');
    const categoriesCollection = db.collection('categories');

    // Atualizar TODOS os canais do usuário
    const channelsResult = await channelsCollection.updateMany(
      { userId: user._id },
      { 
        $set: { 
          listInVideos: true,
          updatedAt: new Date()
        }
      }
    );

    // Atualizar TODAS as categorias do usuário
    const categoriesResult = await categoriesCollection.updateMany(
      { userId: user._id },
      { 
        $set: { 
          listInVideos: true,
          updatedAt: new Date()
        }
      }
    );

    // Verificar se os campos foram realmente adicionados
    const channelsWithField = await channelsCollection.countDocuments({
      userId: user._id,
      listInVideos: { $exists: true }
    });

    const categoriesWithField = await categoriesCollection.countDocuments({
      userId: user._id,
      listInVideos: { $exists: true }
    });

    // Buscar um exemplo de cada para debug
    const sampleChannel = await channelsCollection.findOne({ userId: user._id });
    const sampleCategory = await categoriesCollection.findOne({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Migração FORCE V2 concluída!",
      channelsUpdated: channelsResult.modifiedCount,
      categoriesUpdated: categoriesResult.modifiedCount,
      channelsWithField,
      categoriesWithField,
      sampleChannel: sampleChannel ? {
        _id: sampleChannel._id.toString(),
        title: sampleChannel.title,
        hasListInVideos: 'listInVideos' in sampleChannel,
        listInVideos: sampleChannel.listInVideos,
        campos: Object.keys(sampleChannel)
      } : null,
      sampleCategory: sampleCategory ? {
        _id: sampleCategory._id.toString(),
        name: sampleCategory.name,
        hasListInVideos: 'listInVideos' in sampleCategory,
        listInVideos: sampleCategory.listInVideos,
        campos: Object.keys(sampleCategory)
      } : null
    });

  } catch (error) {
    console.error("Erro na migração FORCE V2:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 