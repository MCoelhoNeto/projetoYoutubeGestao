import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Category from "@models/Category";
import User from "@models/User";
import Channel from "@models/Channel";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const category = await Category.findOne({
  _id: new mongoose.Types.ObjectId(params.id),
  userId: user._id,
});

if (!category) {
  return NextResponse.json(
    { error: "Categoria não encontrada" },
    { status: 404 }
  );
}

// Buscar canais relacionados
const channels = await Channel.find({ categoryId: category._id });

    return NextResponse.json({
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description,
        color: category.color,
        tags: category.tags || "",
        icon: category.icon || "",
        channelsCount: category.channelsCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        channels: channels.map((ch) => ({
          _id: ch._id.toString(),
          youtubeChannelId: ch.youtubeChannelId,
          title: ch.title,
          subscribers: ch.subscribers || "",
          videos: ch.videos || 0,
          cacheStatus: ch.cacheStatus || "",
          analysisCount: ch.analysisCount || 0,
          maxAnalysis: ch.maxAnalysis || 10,
        })),
      },
    });

  } catch (error) {
    console.error("❌ Erro ao obter categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { name, description, color, tags, icon } = await request.json();

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const category = await Category.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(params.id), userId: user._id },
      {
        name: name?.trim(),
        description: description?.trim(),
        color: color || "#3B82F6",
        tags: tags?.trim() || "",
        icon: icon?.trim() || "",
      },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Categoria atualizada com sucesso",
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description,
        color: category.color,
        tags: category.tags || "",
        icon: category.icon || "",
        channelsCount: category.channelsCount,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;

  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const category = await Category.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(params.id),
      userId: user._id,
    });
    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada ou sem permissão" },
        { status: 404 }
      );
    }

    // Atualizar contador
    if (user.usage?.categoriesCount) {
      user.usage.categoriesCount = Math.max(user.usage.categoriesCount - 1, 0);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Categoria deletada com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao deletar categoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
