import { NextRequest, NextResponse } from 'next/server';
import { getWorkerStatus, getPendingAnalysesCount } from '@lib/worker';
import { connectDB } from "@lib/mongodb";
import Analysis from "@models/Analysis";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug - Verificando status do worker...');
    
    const status = getWorkerStatus();
    const pendingCount = await getPendingAnalysesCount();
    
    // Verificar análises no banco
    await connectDB();
    const processingAnalyses = await Analysis.find({ status: "processing" })
      .select('_id videoTitle videoId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10);
    
    const completedAnalyses = await Analysis.find({ status: "completed" })
      .select('_id videoTitle videoId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5);
    
    const errorAnalyses = await Analysis.find({ status: "error" })
      .select('_id videoTitle videoId errorMessage createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      worker: status,
      pendingCount: pendingCount,
      analyses: {
        processing: processingAnalyses,
        completed: completedAnalyses,
        error: errorAnalyses
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        ENABLE_WORKER: process.env.ENABLE_WORKER,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'não definida'
      }
    });

  } catch (error) {
    console.error("❌ Erro ao verificar status do worker:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 