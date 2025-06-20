// C:\Users\mcoel\Documents\projetos\youtube-manager\src\app\api\channels\route.ts
import { connectDB } from '@lib/mongodb';
import Channel from '@models/Channel';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    console.log('Usuário autenticado:', token?.userId); // ex: 6843ca9d7f9dce99f9fafc02

    if (!token?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const data = await req.json();
    await connectDB();

    const novoCanal = await Channel.create({
      ...data,
      userId: token.userId
    });

    return NextResponse.json({ success: true, channel: novoCanal });
  } catch (err) {
    console.error('Erro ao salvar canal:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    await connectDB();

    const channels = await Channel.find({ userId: token.userId })
      .select('_id title channelId listInVideos')
      .sort({ title: 1 });

    return NextResponse.json({ success: true, channels });
  } catch (err) {
    console.error('Erro ao buscar canais:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
