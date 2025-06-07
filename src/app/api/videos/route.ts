// src/app/api/videos/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Video from '@/models/Video';

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    const novoVideo = await Video.create(data);

    return NextResponse.json({ success: true, video: novoVideo });
  } catch (err) {
    console.error('Erro ao salvar vídeo:', err);
    return NextResponse.json({ success: false, error: 'Erro ao salvar vídeo' }, { status: 500 });
  }
}
