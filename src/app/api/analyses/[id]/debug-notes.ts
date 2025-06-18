import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@lib/mongodb';
import mongoose from 'mongoose';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const db = mongoose.connection?.db;
    if (!db) {
      return NextResponse.json({ error: 'DB não conectado' }, { status: 500 });
    }
    const result = await db.collection('analyses').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $push: {
          notes: {
            text: 'debug via endpoint',
            type: 'resumo',
            createdAt: new Date()
          } as any // forçar tipagem para evitar erro de linter
        }
      }
    );
    const doc = await db.collection('analyses').findOne({ _id: new mongoose.Types.ObjectId(id) });
    return NextResponse.json({ result, doc });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 