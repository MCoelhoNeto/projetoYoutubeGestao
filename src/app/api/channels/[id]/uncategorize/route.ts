// /app/api/channels/[id]/uncategorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Channel from '@models/Channel';
import { connectDB } from '@lib/mongodb';
import mongoose from 'mongoose';

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await connectDB();
    const updated = await Channel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $unset: { categoryId: "" } },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: 'Canal não encontrado' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Canal removido da categoria' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
