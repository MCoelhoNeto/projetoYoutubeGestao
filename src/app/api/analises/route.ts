// /src/app/api/analises/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('📩 Vídeo recebido para análise:', body);

  // Aqui você pode inserir no banco, fila, etc.
  return NextResponse.json({ success: true, message: 'Análise recebida' });
}