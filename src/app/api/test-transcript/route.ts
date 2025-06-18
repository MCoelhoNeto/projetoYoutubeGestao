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

    // Teste 1: Verificar se tem transcrições disponíveis
    console.log(`📋 Teste 1: Verificando transcrições disponíveis`);
    const availableTranscripts = await YouTubeTranscriptService.getAvailableTranscripts(videoId);
    console.log(`📊 Transcrições disponíveis:`, availableTranscripts);

    // Teste 2: Verificar se tem transcrição
    console.log(`🔍 Teste 2: Verificando se tem transcrição`);
    const hasTranscript = await YouTubeTranscriptService.hasTranscript(videoId);
    console.log(`📊 Tem transcrição:`, hasTranscript);

    // Teste 3: Tentar obter a transcrição
    console.log(`📄 Teste 3: Tentando obter transcrição`);
    let transcript = null;
    let transcriptError = null;
    
    try {
      transcript = await YouTubeTranscriptService.getTranscript(videoId);
      console.log(`✅ Transcrição obtida com sucesso, tamanho: ${transcript?.length || 0}`);
    } catch (error) {
      transcriptError = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro ao obter transcrição:`, error);
    }

    const response = {
      success: true,
      videoId,
      testResults: {
        availableTranscripts: availableTranscripts,
        hasTranscript: hasTranscript,
        transcriptObtained: !!transcript,
        transcriptLength: transcript ? transcript.length : 0,
        transcriptPreview: transcript ? transcript.substring(0, 200) + '...' : null,
        transcriptError: transcriptError
      },
      message: transcript ? 'Transcrição obtida com sucesso' : 'Não foi possível obter a transcrição',
      debug: {
        availableTranscriptsCount: availableTranscripts.length,
        hasTranscriptResult: hasTranscript,
        transcriptSuccess: !!transcript
      }
    };

    console.log(`📊 Resultado dos testes:`, response);

    if (transcript) {
      return NextResponse.json(response);
    } else {
      return NextResponse.json(response, { status: 404 });
    }

  } catch (error) {
    console.error('❌ Erro no teste de transcrição:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao testar transcrição', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST com { "videoId": "ID_DO_VIDEO" } para testar transcrições'
  });
} 