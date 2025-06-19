import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando Gemini no Next.js...');
    
    // Verificar se a chave está definida
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY não está definida');
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY não está definida'
      });
    }
    
    console.log('✅ GEMINI_API_KEY encontrada');
    
    // Inicializar o Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🤖 Fazendo teste simples...');
    
    const result = await model.generateContent('Diga "Olá, Gemini está funcionando!" em português');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Resposta do Gemini:', text);
    
    return NextResponse.json({
      success: true,
      message: 'Gemini está funcionando!',
      response: text,
      keyPreview: process.env.GEMINI_API_KEY.slice(-4)
    });
    
  } catch (error) {
    console.error('❌ Erro ao testar Gemini:', error);
    
    let errorMessage = 'Erro desconhecido';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      keyPreview: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(-4) : 'não encontrada'
    });
  }
} 