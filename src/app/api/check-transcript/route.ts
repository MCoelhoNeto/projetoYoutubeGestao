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

    console.log(`🔍 Verificando transcrições disponíveis para: ${videoId}`);

    // Verificar se tem transcrição
    const hasTranscript = await YouTubeTranscriptService.hasTranscript(videoId);
    
    // Listar transcrições disponíveis
    const availableTranscripts = await YouTubeTranscriptService.getAvailableTranscripts(videoId);
    
    // Tentar obter uma transcrição de exemplo
    let sampleTranscript = null;
    if (hasTranscript) {
      sampleTranscript = await YouTubeTranscriptService.getTranscript(videoId);
    }

    return NextResponse.json({
      success: true,
      videoId,
      hasTranscript,
      availableTranscripts: availableTranscripts.map((t: any) => ({
        language: t.language,
        languageCode: t.languageCode,
        isGenerated: t.isGenerated,
        isTranslatable: t.isTranslatable
      })),
      sampleTranscriptLength: sampleTranscript ? sampleTranscript.length : 0,
      sampleTranscriptPreview: sampleTranscript ? sampleTranscript.substring(0, 200) + '...' : null,
      message: hasTranscript ? 'Transcrição disponível' : 'Nenhuma transcrição encontrada'
    });

  } catch (error) {
    console.error('❌ Erro ao verificar transcrição:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar transcrição', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST com { "videoId": "ID_DO_VIDEO" } para verificar transcrições disponíveis'
  });
} 