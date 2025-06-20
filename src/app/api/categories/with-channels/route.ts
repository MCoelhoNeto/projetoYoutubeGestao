import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@lib/mongodb';
import Category from '@models/Category';
import Channel from '@models/Channel';
import User from '@models/User';

export async function GET(_: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const categories = await Category.find({ 
      userId: user._id,
      listInVideos: { $ne: false } // Inclui true e undefined (padrão)
    });
    const categoryIds = categories.map(cat => cat._id);
    const allChannels = await Channel.find({ 
      categoryId: { $in: categoryIds },
      listInVideos: { $ne: false } // Inclui true e undefined (padrão)
    });

    // Agrupar os canais por categoria
    const groupedChannels: Record<string, any[]> = {};
    for (const channel of allChannels) {
      const key = channel.categoryId.toString();
      if (!groupedChannels[key]) groupedChannels[key] = [];
      groupedChannels[key].push({
        _id: channel._id,
        youtubeChannelId: channel.youtubeChannelId,
        title: channel.title,
        description: channel.description,
        customUrl: channel.customUrl,
        country: channel.country,
        publishedAt: channel.publishedAt,
        subscribers: channel.statistics?.subscriberCount,
        totalViews: channel.statistics?.viewCount,
        totalVideos: channel.statistics?.videoCount,
        thumbnail: channel.thumbnails?.high || channel.thumbnails?.medium || channel.thumbnails?.default,
        cacheStatus: channel.cacheStatus,
        analysisCount: channel.analysisCount,
        maxAnalysis: channel.maxAnalysis,
        lastAnalysis: channel.lastAnalysis,
        socialLinks: channel.socialLinks || {},
        listInVideos: channel.listInVideos === undefined ? true : channel.listInVideos
      });
    }

    const categoriesWithChannels = categories.map(cat => ({
      _id: cat._id.toString(),
      name: cat.name,
      color: cat.color,
      listInVideos: cat.listInVideos === undefined ? true : cat.listInVideos,
      channels: groupedChannels[cat._id.toString()] || []
    }));

    return NextResponse.json({ success: true, categories: categoriesWithChannels });

  } catch (error) {
    console.error('❌ Erro ao buscar categorias com canais:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
