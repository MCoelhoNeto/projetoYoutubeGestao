import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import Category from "@models/Category";
import User from "@models/User";
import mongoose from "mongoose";

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

    // Buscar via Mongoose também
    const mongooseChannels = await Channel.find({ userId: user._id });
    const mongooseCategories = await Category.find({ userId: user._id });

    // Comparar os primeiros documentos
    const sampleChannelRaw = rawChannels[0];
    const sampleChannelMongoose = mongooseChannels[0];
    const sampleCategoryRaw = rawCategories[0];
    const sampleCategoryMongoose = mongooseCategories[0];

    return NextResponse.json({
      totalCanais: rawChannels.length,
      totalCategorias: rawCategories.length,
      
      // Dados brutos do MongoDB
      sampleChannelRaw: sampleChannelRaw ? {
        _id: sampleChannelRaw._id.toString(),
        title: sampleChannelRaw.title,
        hasListInVideos: 'listInVideos' in sampleChannelRaw,
        listInVideos: sampleChannelRaw.listInVideos,
        tipo: typeof sampleChannelRaw.listInVideos,
        campos: Object.keys(sampleChannelRaw),
        rawData: sampleChannelRaw
      } : null,

      sampleCategoryRaw: sampleCategoryRaw ? {
        _id: sampleCategoryRaw._id.toString(),
        name: sampleCategoryRaw.name,
        hasListInVideos: 'listInVideos' in sampleCategoryRaw,
        listInVideos: sampleCategoryRaw.listInVideos,
        tipo: typeof sampleCategoryRaw.listInVideos,
        campos: Object.keys(sampleCategoryRaw),
        rawData: sampleCategoryRaw
      } : null,

      // Dados via Mongoose
      sampleChannelMongoose: sampleChannelMongoose ? {
        _id: sampleChannelMongoose._id.toString(),
        title: sampleChannelMongoose.title,
        hasListInVideos: 'listInVideos' in sampleChannelMongoose,
        listInVideos: sampleChannelMongoose.listInVideos,
        tipo: typeof sampleChannelMongoose.listInVideos,
        campos: Object.keys(sampleChannelMongoose.toObject()),
        toObject: sampleChannelMongoose.toObject(),
        toJSON: sampleChannelMongoose.toJSON()
      } : null,

      sampleCategoryMongoose: sampleCategoryMongoose ? {
        _id: sampleCategoryMongoose._id.toString(),
        name: sampleCategoryMongoose.name,
        hasListInVideos: 'listInVideos' in sampleCategoryMongoose,
        listInVideos: sampleCategoryMongoose.listInVideos,
        tipo: typeof sampleCategoryMongoose.listInVideos,
        campos: Object.keys(sampleCategoryMongoose.toObject()),
        toObject: sampleCategoryMongoose.toObject(),
        toJSON: sampleCategoryMongoose.toJSON()
      } : null,

      // Comparação
      comparison: {
        channel: {
          rawHasField: sampleChannelRaw ? 'listInVideos' in sampleChannelRaw : false,
          mongooseHasField: sampleChannelMongoose ? 'listInVideos' in sampleChannelMongoose : false,
          rawValue: sampleChannelRaw?.listInVideos,
          mongooseValue: sampleChannelMongoose?.listInVideos,
          rawType: typeof sampleChannelRaw?.listInVideos,
          mongooseType: typeof sampleChannelMongoose?.listInVideos
        },
        category: {
          rawHasField: sampleCategoryRaw ? 'listInVideos' in sampleCategoryRaw : false,
          mongooseHasField: sampleCategoryMongoose ? 'listInVideos' in sampleCategoryMongoose : false,
          rawValue: sampleCategoryRaw?.listInVideos,
          mongooseValue: sampleCategoryMongoose?.listInVideos,
          rawType: typeof sampleCategoryRaw?.listInVideos,
          mongooseType: typeof sampleCategoryMongoose?.listInVideos
        }
      }
    });

  } catch (error) {
    console.error("Erro no debug raw v2:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 