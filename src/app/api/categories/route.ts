// C:\Users\mcoel\Documents\projetos\youtube-manager\src\app\api\categories\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@lib/mongodb';
import Category from '@models/Category';
import User from '@models/User';
import Channel from '@models/Channel'; // 👈 Importante!
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ObjectId } from 'mongodb';



export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('📁 Listando categorias para:', session.user.email);

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const categories = await Category.find({ userId: user._id }).sort({ createdAt: -1 });

    // 👇 Mapeia todas as categorias com a contagem real de canais
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const count = await Channel.countDocuments({ categoryId: cat._id });
        return {
          _id: cat._id.toString(),
          name: cat.name,
          description: cat.description,
          color: cat.color,
          channelsCount: count,
          createdAt: cat.createdAt,
          listInVideos: cat.listInVideos === undefined ? true : cat.listInVideos
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: enriched
    });

  } catch (error) {
    console.error('❌ Erro ao listar categorias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { name, description, color, tags, icon } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: 'Nome da categoria deve ter no máximo 50 caracteres' }, { status: 400 });
    }

    console.log('📁 Criando categoria:', { name, description, color, tags, icon });

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const maxCategories = user.plan?.features?.maxCategories || 5;
    const currentCount = await Category.countDocuments({ userId: user._id });

    if (currentCount >= maxCategories) {
      return NextResponse.json({ error: `Limite de categorias atingido (${maxCategories}). Faça upgrade.` }, { status: 403 });
    }

    const existing = await Category.findOne({
      userId: user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 400 });
    }

    const category = await Category.create({
      userId: user._id,
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      tags: tags?.trim() || '',
      icon: icon?.trim() || '',
      channelsCount: 0
    });

    // Atualiza uso do plano
    if (!user.usage) {
      user.usage = { categoriesCount: 0 };
    }
    user.usage.categoriesCount += 1;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Categoria criada com sucesso',
      category: {
        _id: category._id.toString(),
        name: category.name,
        description: category.description,
        color: category.color,
        tags: category.tags,
        icon: category.icon,
        channelsCount: category.channelsCount,
        createdAt: category.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
