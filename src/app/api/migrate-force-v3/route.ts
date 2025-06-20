import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import Category from "@models/Category";
import User from "@models/User";
import mongoose from "mongoose";

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

    console.log('=== MIGRAÇÃO FORCE V3 ===');
    console.log('Usuário:', user.email);

    // Usar a coleção diretamente
    const db = Channel.db;
    const channelsCollection = db.collection('channels');
    const categoriesCollection = db.collection('categories');

    // Buscar documentos ANTES da migração
    const channelsBefore = await channelsCollection.find({ userId: user._id }).toArray();
    const categoriesBefore = await categoriesCollection.find({ userId: user._id }).toArray();

    console.log('Canais ANTES:', channelsBefore.length);
    console.log('Categorias ANTES:', categoriesBefore.length);

    // Verificar quais documentos já têm o campo
    const channelsWithField = channelsBefore.filter(c => 'listInVideos' in c);
    const categoriesWithField = categoriesBefore.filter(c => 'listInVideos' in c);

    console.log('Canais com campo ANTES:', channelsWithField.length);
    console.log('Categorias com campo ANTES:', categoriesWithField.length);

    // Atualizar TODOS os canais - forçar a adição do campo
    const channelsResult = await channelsCollection.updateMany(
      { userId: user._id },
      { 
        $set: { 
          listInVideos: true,
          updatedAt: new Date()
        }
      }
    );

    // Atualizar TODAS as categorias - forçar a adição do campo
    const categoriesResult = await categoriesCollection.updateMany(
      { userId: user._id },
      { 
        $set: { 
          listInVideos: true,
          updatedAt: new Date()
        }
      }
    );

    console.log('Resultado canais:', {
      matchedCount: channelsResult.matchedCount,
      modifiedCount: channelsResult.modifiedCount
    });

    console.log('Resultado categorias:', {
      matchedCount: categoriesResult.matchedCount,
      modifiedCount: categoriesResult.modifiedCount
    });

    // Buscar documentos DEPOIS da migração
    const channelsAfter = await channelsCollection.find({ userId: user._id }).toArray();
    const categoriesAfter = await categoriesCollection.find({ userId: user._id }).toArray();

    // Verificar quais documentos têm o campo agora
    const channelsWithFieldAfter = channelsAfter.filter(c => 'listInVideos' in c);
    const categoriesWithFieldAfter = categoriesAfter.filter(c => 'listInVideos' in c);

    console.log('Canais com campo DEPOIS:', channelsWithFieldAfter.length);
    console.log('Categorias com campo DEPOIS:', categoriesWithFieldAfter.length);

    // Buscar exemplos para debug
    const sampleChannel = channelsAfter[0];
    const sampleCategory = categoriesAfter[0];

    return NextResponse.json({
      success: true,
      message: "Migração FORCE V3 concluída!",
      before: {
        totalChannels: channelsBefore.length,
        totalCategories: categoriesBefore.length,
        channelsWithField: channelsWithField.length,
        categoriesWithField: categoriesWithField.length
      },
      after: {
        totalChannels: channelsAfter.length,
        totalCategories: categoriesAfter.length,
        channelsWithField: channelsWithFieldAfter.length,
        categoriesWithField: categoriesWithFieldAfter.length
      },
      updateResults: {
        channels: {
          matchedCount: channelsResult.matchedCount,
          modifiedCount: channelsResult.modifiedCount
        },
        categories: {
          matchedCount: categoriesResult.matchedCount,
          modifiedCount: categoriesResult.modifiedCount
        }
      },
      sampleChannel: sampleChannel ? {
        _id: sampleChannel._id.toString(),
        title: sampleChannel.title,
        hasListInVideos: 'listInVideos' in sampleChannel,
        listInVideos: sampleChannel.listInVideos,
        tipo: typeof sampleChannel.listInVideos,
        campos: Object.keys(sampleChannel)
      } : null,
      sampleCategory: sampleCategory ? {
        _id: sampleCategory._id.toString(),
        name: sampleCategory.name,
        hasListInVideos: 'listInVideos' in sampleCategory,
        listInVideos: sampleCategory.listInVideos,
        tipo: typeof sampleCategory.listInVideos,
        campos: Object.keys(sampleCategory)
      } : null
    });

  } catch (error) {
    console.error("Erro na migração FORCE V3:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 