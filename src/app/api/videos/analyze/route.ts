import { getToken } from 'next-auth/jwt';
import { connectDB } from '@lib/mongodb';
import Channel from '@models/Channel';
import Category from '@models/Category';
import VideoCache from '@models/VideoCache';
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    await connectDB();
    const canais = await Channel.find({ userId: token.userId }).lean();

    const categoriasMap = new Map<string, { categoriaNome: string; canais: any[] }>();
    const today = dayjs().format('YYYY-MM-DD');

    for (const canal of canais) {
      const categoriaId = canal.categoryId?.toString() || 'sem-categoria';

      // Tenta carregar cache do dia
      let cache = await VideoCache.findOne({
        userId: token.userId,
        channelId: canal.youtubeChannelId,
        date: today
      }).lean();

      let videos;

      if (!cache) {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${canal.youtubeChannelId}&part=snippet&order=date&maxResults=5&type=video`);
        const { items } = await res.json();

        videos = items?.map((item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails.medium.url
        })) || [];

        await VideoCache.create({
          userId: token.userId,
          channelId: canal.youtubeChannelId,
          date: today,
          videos
        });
      } else {
        videos = cache.videos;
      }

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
