import { NextRequest, NextResponse } from 'next/server';
import { startAnalysisWorker, getWorkerStatus } from '@lib/worker';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API - Forçando início do worker...');
    
    // Forçar início do worker
    startAnalysisWorker();
    
    // Aguardar um pouco para o worker inicializar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar status
    const status = getWorkerStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Worker iniciado manualmente',
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erro ao iniciar worker:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = getWorkerStatus();
    
    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Erro ao verificar status do worker:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 