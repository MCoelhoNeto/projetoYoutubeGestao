import { getToken } from 'next-auth/jwt';
import { connectDB } from '@lib/mongodb';
import Channel from '@models/Channel';
import Category from '@models/Category';
import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const canais = await Channel.find({ userId: token.userId }).lean();

    const categoriasMap = new Map<string, { categoriaNome: string, canais: any[] }>();

    for (const canal of canais) {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${canal.youtubeChannelId}&part=snippet&order=date&maxResults=5&type=video`);

      const { items } = await res.json();

      const videos = items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url
      }));

      const categoriaId = canal.categoryId?.toString() || 'sem-categoria';

      if (!categoriasMap.has(categoriaId)) {
        const categoria = await Category.findById(canal.categoryId).lean();
        categoriasMap.set(categoriaId, {
          categoriaNome: categoria?.name || 'Sem categoria',
          canais: []
        });
      }

      categoriasMap.get(categoriaId)!.canais.push({
        canalId: canal._id,
        canalNome: canal.title,
        videos
      });
    }

    return NextResponse.json(Array.from(categoriasMap.values()));
  } catch (err) {
    console.error('Erro ao buscar vídeos:', err);
    return NextResponse.json({ error: 'Erro interno ao buscar vídeos' }, { status: 500 });
  }
}
