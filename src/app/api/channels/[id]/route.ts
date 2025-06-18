import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import User from "@models/User";

// GET - Buscar canal específico
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

    const channel = await Channel.findOne({ _id: params.id, userId: user._id });
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Erro ao buscar canal:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar canal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, categoryId, socialLinks } = body;

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const channel = await Channel.findOne({ _id: params.id, userId: user._id });
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    // Atualizar campos
    if (title !== undefined) channel.title = title;
    if (description !== undefined) channel.description = description;
    if (categoryId !== undefined) channel.categoryId = categoryId;
    if (socialLinks !== undefined) channel.socialLinks = socialLinks;

    await channel.save();

    return NextResponse.json({ 
      message: "Canal atualizado com sucesso",
      channel 
    });
  } catch (error) {
    console.error("Erro ao atualizar canal:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir canal
export async function DELETE(
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

    const channel = await Channel.findOne({ _id: params.id, userId: user._id });
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    await Channel.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      message: "Canal excluído com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao excluir canal:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 