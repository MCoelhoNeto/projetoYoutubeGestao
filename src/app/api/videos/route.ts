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
    if (!token?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    // ✅ Filtra apenas canais que têm categoria definida
    const canais = await Channel.find({
      userId: token.userId,
      categoryId: { $ne: null }
    }).lean();

    const categoriasMap = new Map<string, { categoriaNome: string; canais: any[] }>();
    const today = dayjs().format('YYYY-MM-DD');

    for (const canal of canais) {
      // 🔄 Converte ObjectId para string
      const categoriaId = canal.categoryId?.toString();

      // ❌ Se não tiver categoria, pula
      if (!categoriaId) continue;

      // ✅ Busca a categoria e ignora se não existir
      const categoria = await Category.findById(categoriaId).lean();
      if (!categoria) continue;

      // ✅ Verifica cache
      const cache = await VideoCache.findOne({
        userId: token.userId,
        channelId: canal.youtubeChannelId,
        date: today
      }).lean();

      let videos = [];

      if (cache) {
        console.log(`✅ Usando cache para canal: ${canal.title}`);
        videos = cache.videos;
      } else {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${canal.youtubeChannelId}&part=snippet&order=date&maxResults=8&type=video`;

        console.log(`🌐 Requisição para YouTube: ${url}`);
        const res = await fetch(url);

        let ytJson;
        try {
          ytJson = await res.json();
        } catch (e) {
          return NextResponse.json({ error: 'Erro ao processar resposta do YouTube', erro: { message: e.message } }, { status: 502 });
        }

        if (!res.ok) {
          return NextResponse.json({ error: 'Erro da API do YouTube', erro: ytJson }, { status: res.status });
        }

        videos = ytJson.items?.map((item: any) => ({
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
      }

      if (!categoriasMap.has(categoriaId)) {
        categoriasMap.set(categoriaId, {
          categoriaNome: categoria.name,
          canais: []
        });
      }

      categoriasMap.get(categoriaId)!.canais.push({
        canalId: canal._id,
        customUrl: canal.customUrl,
        canalNome: canal.title,
        videos,
        fromCache: !!cache,
      });
    }

    return NextResponse.json(Array.from(categoriasMap.values()));
  } catch (err: any) {
    console.error('❌ Erro inesperado ao buscar vídeos:', err);
    return NextResponse.json({ error: 'Erro interno ao buscar vídeos', erro: err?.message || err }, { status: 500 });
  }
}
