import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando variáveis de ambiente no Next.js...');
    
    // Verificar se as variáveis estão carregadas
    const envVars = {
      'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
      'ENABLE_WORKER': process.env.ENABLE_WORKER,
      'MONGODB_URI': process.env.MONGODB_URI,
      'NODE_ENV': process.env.NODE_ENV
    };

    const results: any = {
      success: true,
      message: 'Variáveis de ambiente verificadas',
      variables: {}
    };

    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        results.variables[key] = {
          found: true,
          value: key.includes('KEY') || key.includes('SECRET') ? '***' + value.slice(-4) : value
        };
      } else {
        results.variables[key] = {
          found: false,
          value: null
        };
      }
    }

    // Teste específico do Gemini
    if (process.env.GEMINI_API_KEY) {
      results.geminiTest = {
        status: 'success',
        message: 'GEMINI_API_KEY encontrada',
        keyPreview: process.env.GEMINI_API_KEY.slice(-4)
      };
    } else {
      results.geminiTest = {
        status: 'error',
        message: 'GEMINI_API_KEY não encontrada'
      };
    }

    console.log('📋 Resultados:', results);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Erro ao testar variáveis:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 