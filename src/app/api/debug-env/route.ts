import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NODE_ENV: process.env.NODE_ENV
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
      message: "Verifique se todas as variáveis estão definidas"
    });
    
  } catch (error) {
    console.error("❌ Erro ao verificar variáveis de ambiente:", error);
    return NextResponse.json(
      { error: "Erro ao verificar configurações" },
      { status: 500 }
    );
  }
} 