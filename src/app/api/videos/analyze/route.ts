import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import { google } from '@google-ai/generativelanguage';
import { GoogleAuth } from 'google-auth-library';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { videoId } = await request.json();
    if (!videoId) {
      return NextResponse.json({ error: 'ID do vídeo é obrigatório' }, { status: 400 });
    }

    const { db } = await connectDB();

    // Buscar usuário
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar limite de análises
    const max = user.plan?.features?.maxAnalysesPerMonth || 10;
    const used = user.usage?.analysesThisMonth || 0;
    if (used >= max) {
      return NextResponse.json({ error: 'Limite de análises atingido para o mês' }, { status: 403 });
    }

    // Buscar vídeo
    const video = await db.collection('channel_videos').findOne({
      _id: new ObjectId(videoId),
      userId: user._id
    });

    if (!video) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    if (!video.transcript?.text) {
      return NextResponse.json({ error: 'Transcrição do vídeo não disponível' }, { status: 400 });
    }

    const prompt = `
Você é um especialista em conteúdo educacional. Leia a seguinte transcrição de vídeo e:

1. Gere um resumo em **dois parágrafos**.
2. Gere uma lista de tópicos importantes.
3. Dê sua opinião crítica (positiva ou negativa) sobre a abordagem, com nível de confiança.

TRANSCRIÇÃO:
${video.transcript.text}
`;

    // Autenticar com a API do Gemini
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = new google.GenerativeLanguageServiceClient({
      authClient: await auth.getClient()
    });

    const model = 'models/gemini-1.5-pro';

    const [result] = await client.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const output = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const summaryMatch = output.match(/Resumo:(.+?)\n\n/s);
    const topicsMatch = output.match(/Tópicos:(.+?)\n\n/s);
    const opinionMatch = output.match(/Opinião:(.+)/s);

    const analysis = {
      summary: summaryMatch?.[1]?.trim() || '',
      topics: (topicsMatch?.[1] || '')
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean),
      geminiOpinion: {
        reasoning: opinionMatch?.[1]?.trim() || '',
        confidence: 0.85 // pode ser estimado ou ajustado futuramente
      },
      analyzedAt: new Date(),
      modelVersion: model,
      tokensUsed: video.transcript.wordCount || 0,
      processingTime: 15
    };

    const inserted = await db.collection('video_analyses').insertOne({
      userId: user._id,
      videoId: video._id,
      ...analysis
    });

    await db.collection('channel_videos').updateOne(
      { _id: video._id },
      {
        $set: {
          aiAnalysis: {
            analyzed: true,
            analysisId: inserted.insertedId,
            summary: analysis.summary,
            topics: analysis.topics,
            geminiOpinion: analysis.geminiOpinion,
            analyzedAt: new Date()
          }
        }
      }
    );

    // Atualizar contador de uso
    await db.collection('users').updateOne(
      { _id: user._id },
      { $inc: { 'usage.analysesThisMonth': 1 } }
    );

    return NextResponse.json({
      success: true,
      message: 'Análise concluída com sucesso',
      analysisId: inserted.insertedId.toString(),
    });
  } catch (error) {
    console.error('❌ Erro ao analisar vídeo:', error);
    return NextResponse.json({ error: 'Erro ao processar análise' }, { status: 500 });
  }
}
