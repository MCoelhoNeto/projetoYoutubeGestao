import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: "videoId é obrigatório" }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "API key do YouTube não configurada" }, { status: 500 });
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API do YouTube: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });
    }

    const videoInfo = data.items[0].snippet;

    return NextResponse.json({
      success: true,
      videoInfo: {
        title: videoInfo.title,
        description: videoInfo.description,
        channelTitle: videoInfo.channelTitle,
        channelId: videoInfo.channelId,
        publishedAt: videoInfo.publishedAt,
        thumbnails: videoInfo.thumbnails
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar informações do vídeo:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 