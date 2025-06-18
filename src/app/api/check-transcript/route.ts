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
    let transcriptError = null;
    
    if (hasTranscript) {
      try {
        sampleTranscript = await YouTubeTranscriptService.getTranscript(videoId);
      } catch (error) {
        transcriptError = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('❌ Erro ao obter transcrição de exemplo:', error);
      }
    }

    const response = {
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
      transcriptError,
      message: hasTranscript ? 'Transcrição disponível' : 'Nenhuma transcrição encontrada',
      debug: {
        availableTranscriptsCount: availableTranscripts.length,
        hasTranscriptResult: hasTranscript,
        sampleTranscriptSuccess: !!sampleTranscript
      }
    };

    console.log(`📊 Resposta da verificação:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro ao verificar transcrição:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar transcrição', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
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