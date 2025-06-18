import { NextRequest, NextResponse } from 'next/server';
import YouTubeTranscriptService from "@lib/youtube-transcript";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testando transcrição para: ${videoId}`);

    // Testar o novo serviço de transcrição
    const transcript = await YouTubeTranscriptService.getTranscript(videoId);

    if (transcript) {
      return NextResponse.json({
        success: true,
        videoId,
        transcriptLength: transcript.length,
        transcriptPreview: transcript.substring(0, 200) + '...',
        message: 'Transcrição obtida com sucesso'
      });
    } else {
      return NextResponse.json({
        success: false,
        videoId,
        message: 'Não foi possível obter a transcrição. Verifique se o vídeo tem legendas disponíveis.'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('❌ Erro no teste de transcrição:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao testar transcrição', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST com { "videoId": "ID_DO_VIDEO" } para testar a transcrição'
  });
} 