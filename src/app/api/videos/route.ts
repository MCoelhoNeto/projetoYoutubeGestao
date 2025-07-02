import { getToken } from 'next-auth/jwt';
import { connectDB } from '@lib/mongodb';
import Channel from '@models/Channel';
import Category from '@models/Category';
import VideoCache from '@models/VideoCache';
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_KEY2 = process.env.YOUTUBE_API_KEY2;

// Função para fazer requisição com fallback de chaves
async function fetchYouTubeData(channelId: string, attempt = 1): Promise<any> {
  const keys = [YOUTUBE_API_KEY, YOUTUBE_API_KEY2];
  const currentKey = keys[(attempt - 1) % keys.length];
  
  const url = `https://www.googleapis.com/youtube/v3/search?key=${currentKey}&channelId=${channelId}&part=snippet&order=date&maxResults=8&type=video`;
  
  console.log(`🌐 Tentativa ${attempt} - Requisição para YouTube: ${url}`);
  
  try {
    const res = await fetch(url);
    const ytJson = await res.json();
    
    // 🔍 Console log do retorno da API do YouTube
    console.log(`📺 Resposta da API do YouTube para canal ${channelId}:`, JSON.stringify(ytJson, null, 2));
    
    // Se a resposta não for ok, verifica se é erro de quota/rate limit
    if (!res.ok) {
      const errorCode = ytJson.error?.code;
      const errorMessage = ytJson.error?.message || '';
      
      // Erros que indicam problemas de quota/rate limit
      const quotaErrors = [403, 429];
      const quotaErrorMessages = ['quota', 'rate', 'limit', 'exceeded', 'quotaExceeded'];
      
      const isQuotaError = quotaErrors.includes(errorCode) || 
                          quotaErrorMessages.some(msg => errorMessage.toLowerCase().includes(msg));
      
      // Se for erro de quota e ainda não tentou a segunda chave, tenta novamente
      if (isQuotaError && attempt < 2) {
        console.log(`⚠️ Erro de quota detectado na chave ${attempt}, tentando próxima chave...`);
        return await fetchYouTubeData(channelId, attempt + 1);
      }
      
      // Se chegou aqui, é um erro definitivo
      throw new Error(`Erro da API do YouTube: ${errorCode} - ${errorMessage}`);
    }
    
    return ytJson;
  } catch (error: any) {
    // Se for erro de rede e ainda não tentou a segunda chave, tenta novamente
    if (attempt < 2) {
      console.log(`⚠️ Erro de rede na tentativa ${attempt}, tentando próxima chave...`);
      return await fetchYouTubeData(channelId, attempt + 1);
    }
    
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    // ✅ Filtra apenas canais que têm categoria definida E listInVideos = true
    const canais = await Channel.find({
      userId: token.userId,
      categoryId: { $ne: null },
      listInVideos: { $ne: false } // Inclui true e undefined (padrão)
    }).lean() as any[];

    const categoriasMap = new Map<string, { categoriaNome: string; canais: any[] }>();
    const today = dayjs().format('YYYY-MM-DD');

    for (const canal of canais) {
      // 🔄 Converte ObjectId para string
      const categoriaId = canal.categoryId?.toString();

      // ❌ Se não tiver categoria, pula
      if (!categoriaId) continue;

      // ✅ Busca a categoria e ignora se não existir OU se listInVideos = false
      const categoria = await Category.findById(categoriaId).lean() as any;
      if (!categoria) continue;
      
      // ✅ Verifica se a categoria deve aparecer na lista de vídeos
      if (categoria.listInVideos === false) {
        console.log(`⏭️ Categoria ${categoria.name} ignorada (listInVideos = false)`);
        continue;
      }

      // ✅ Verifica cache
      const cache = await VideoCache.findOne({
        userId: token.userId,
        channelId: canal.youtubeChannelId,
        date: today
      }).lean() as any;

      let videos = [];

      if (cache) {
        console.log(`✅ Usando cache para canal: ${canal.title}`);
        videos = cache.videos;
      } else {
        try {
          const ytJson = await fetchYouTubeData(canal.youtubeChannelId);
          
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
        } catch (error: any) {
          console.error(`❌ Erro ao buscar vídeos do canal ${canal.title}:`, error.message);
          // Continua com o próximo canal em caso de erro
          continue;
        }
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
