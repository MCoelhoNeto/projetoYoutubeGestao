// src/app/api/youtube/search-channel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { query, type } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 });
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ 
        error: 'YouTube API Key não configurada' 
      }, { status: 500 });
    }

    console.log('🔍 Buscando canal:', { query, type });

    let channelId = '';
    let searchUrl = '';

    if (type === 'url') {
      // Extrair ID do canal da URL
      channelId = extractChannelIdFromUrl(query);
      
      if (!channelId) {
        // Se não conseguiu extrair ID da URL, tentar buscar pelo handle/username
        const username = extractUsernameFromUrl(query);
        if (username) {
          // Buscar canal por username
          searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&forUsername=${username}&key=${YOUTUBE_API_KEY}`;
        } else {
          return NextResponse.json({ 
            error: 'URL do canal inválida. Use formatos como: youtube.com/channel/ID, youtube.com/c/nome, youtube.com/@nome' 
          }, { status: 400 });
        }
      } else {
        // Buscar canal por ID
        searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
      }
    } else {
      // Buscar por nome do canal
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
      );

      if (!searchResponse.ok) {
        throw new Error('Erro na API do YouTube');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return NextResponse.json({ 
          error: 'Canal não encontrado' 
        }, { status: 404 });
      }

      channelId = searchData.items[0].id.channelId;
      searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    }

    // Buscar detalhes completos do canal
    console.log('📡 Fazendo requisição para YouTube API:', searchUrl);
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro da YouTube API:', errorData);
      
      if (response.status === 403) {
        return NextResponse.json({ 
          error: 'Quota da YouTube API excedida. Tente novamente mais tarde.' 
        }, { status: 429 });
      }
      
      throw new Error(`YouTube API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ 
        error: 'Canal não encontrado' 
      }, { status: 404 });
    }

    const channel = data.items[0];
    
    // Formatar dados do canal
    const channelData = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl || '',
      thumbnails: {
        default: channel.snippet.thumbnails.default?.url || '',
        medium: channel.snippet.thumbnails.medium?.url || '',
        high: channel.snippet.thumbnails.high?.url || ''
      },
      statistics: {
        subscriberCount: channel.statistics.subscriberCount || '0',
        videoCount: channel.statistics.videoCount || '0',
        viewCount: channel.statistics.viewCount || '0'
      },
      publishedAt: channel.snippet.publishedAt,
      country: channel.snippet.country || '',
      defaultLanguage: channel.snippet.defaultLanguage || ''
    };

    console.log('✅ Canal encontrado:', channelData.title);

    return NextResponse.json({
      success: true,
      channel: channelData
    });

  } catch (error) {
    console.error('❌ Erro na busca do canal:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Funções auxiliares para extrair ID do canal
function extractChannelIdFromUrl(url: string): string {
  // Remover protocolo e www
  const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
  
  // Padrões para extrair ID do canal
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtu\.be\/channel\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) return match[1];
  }
  
  return '';
}

function extractUsernameFromUrl(url: string): string {
  // Remover protocolo e www
  const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '');
  
  // Padrões para extrair username/handle
  const patterns = [
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtu\.be\/c\/([a-zA-Z0-9_-]+)/,
    /youtu\.be\/@([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) return match[1];
  }
  
  return '';
}