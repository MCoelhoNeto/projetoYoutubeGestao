import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getWorkerStatus, getPendingAnalysesCount } from '@lib/worker';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const status = getWorkerStatus();
    const pendingCount = await getPendingAnalysesCount();

    return NextResponse.json({
      success: true,
      worker: status,
      pendingAnalyses: pendingCount
    });

  } catch (error) {
    console.error("Erro ao buscar status do worker:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 