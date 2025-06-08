import { getToken } from 'next-auth/jwt';
import { connectDB } from '@lib/mongodb';
import VideoCache from '@models/VideoCache';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    await connectDB();
    const deleted = await VideoCache.deleteMany({ userId: token.userId });

    return NextResponse.json({
      success: true,
      message: `Cache limpo: ${deleted.deletedCount} registros removidos`
    });
  } catch (err) {
    console.error('Erro ao limpar cache:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
