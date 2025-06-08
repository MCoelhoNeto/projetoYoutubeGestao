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
    const canais = await Channel.find({ userId: token.userId }).lean();
    const categoriasMap = new Map<string, { categoriaNome: string; canais: any[] }>();
    const today = dayjs().format('YYYY-MM-DD');

    for (const canal of canais) {
      const categoriaId = canal.categoryId?.toString() || 'sem-categoria';

      // Verifica cache do dia
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
        const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${canal.youtubeChannelId}&part=snippet&order=date&maxResults=4&type=video`;
        console.log(`🌐 Fazendo requisição para YouTube: ${url}`);

        const res = await fetch(url);

        // Log detalhado
        console.log(`🔎 Status HTTP: ${res.status}`);
        console.log('🔁 Headers da resposta:');
        for (const [key, value] of res.headers.entries()) {
          console.log(`   ${key}: ${value}`);
        }

        let ytJson;
        try {
          ytJson = await res.json();
        } catch (e) {
          console.error('❌ Erro ao parsear JSON da resposta:', e);
          return NextResponse.json({
            error: 'Erro ao processar resposta do YouTube',
            erro: { message: e.message }
          }, { status: 502 });
        }

        if (!res.ok) {
          console.error('❌ Erro da API do YouTube (body):', JSON.stringify(ytJson, null, 2));
          return NextResponse.json({
            error: 'Erro da API do YouTube',
            erro: ytJson
          }, { status: res.status });
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
        const categoria = await Category.findById(canal.categoryId).lean();
        categoriasMap.set(categoriaId, {
          categoriaNome: categoria?.name || 'Sem categoria',
          canais: []
        });
      }

      categoriasMap.get(categoriaId)!.canais.push({
        canalId: canal._id,
        customUrl:canal.customUrl,
        canalNome: canal.title,
        videos,
        fromCache: !!cache,
      });
    }

    return NextResponse.json(Array.from(categoriasMap.values()));
  } catch (err: any) {
    console.error('❌ Erro inesperado ao buscar vídeos:', err);
    return NextResponse.json({
      error: 'Erro interno ao buscar vídeos',
      erro: err?.message || err
    }, { status: 500 });
  }
}
