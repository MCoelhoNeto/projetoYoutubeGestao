import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@lib/mongodb";
import Channel from "@models/Channel";
import User from "@models/User";
import Category from "@models/Category";

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

    console.log('API GET - Canal encontrado:', {
      _id: channel._id,
      title: channel.title,
      listInVideos: channel.listInVideos,
      tipo: typeof channel.listInVideos
    });

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

export async function GET_CATEGORIES_WITH_CHANNELS(
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

    const categories = await Category.find({ userId: user._id })
      .populate({
        path: 'channels',
        select: 'youtubeChannelId title description customUrl country publishedAt subscribers totalViews totalVideos thumbnail cacheStatus analysisCount maxAnalysis lastAnalysis categoryId socialLinks'
      });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Erro ao buscar categorias com canais:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar campos específicos
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    console.log('PATCH - Dados recebidos:', body);

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const channel = await Channel.findOne({ _id: params.id, userId: user._id });
    if (!channel) {
      return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
    }

    console.log('PATCH - Canal antes da atualização:', {
      _id: channel._id,
      title: channel.title,
      categoryId: channel.categoryId,
      listInVideos: channel.listInVideos
    });

    // Atualizar apenas os campos fornecidos
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined) {
        (channel as any)[key] = body[key];
      }
    });

    console.log('PATCH - Canal após atualização:', {
      _id: channel._id,
      title: channel.title,
      categoryId: channel.categoryId,
      listInVideos: channel.listInVideos
    });

    await channel.save();

    // Se o canal tem uma categoria, também atualizar a categoria
    if (channel.categoryId) {
      console.log('PATCH - Atualizando categoria também:', channel.categoryId);
      
      const category = await Category.findOne({ _id: channel.categoryId, userId: user._id });
      if (category) {
        // Se estamos atualizando listInVideos, aplicar a mesma lógica na categoria
        if (body.listInVideos !== undefined) {
          category.listInVideos = body.listInVideos;
          await category.save();
          console.log('PATCH - Categoria atualizada:', {
            _id: category._id,
            name: category.name,
            listInVideos: category.listInVideos
          });
        }
      }
    }

    console.log('PATCH - Canal salvo com sucesso');

    return NextResponse.json({ 
      message: "Campo atualizado com sucesso",
      channel: {
        _id: channel._id,
        listInVideos: channel.listInVideos
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 