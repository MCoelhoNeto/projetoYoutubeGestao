import { getAnalysisWorker } from '../workers/analysisWorker';

let workerStarted = false;

export function startAnalysisWorker() {
  if (workerStarted) {
    console.log('⚠️ Worker já foi iniciado');
    return;
  }

  // Só iniciar o worker em produção ou quando explicitamente solicitado
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WORKER === 'true') {
    console.log('🚀 Iniciando Analysis Worker...');
    
    const worker = getAnalysisWorker();
    worker.start().catch((error: Error) => {
      console.error('❌ Erro ao iniciar worker:', error);
    });
    
    workerStarted = true;
  } else {
    console.log('⏸️ Worker não iniciado (modo desenvolvimento)');
  }
}

export function getWorkerStatus() {
  if (!workerStarted) {
    return { isRunning: false, message: 'Worker não iniciado' };
  }
  
  const worker = getAnalysisWorker();
  return worker.getStatus();
}

export async function getPendingAnalysesCount() {
  if (!workerStarted) {
    return 0;
  }
  
  const worker = getAnalysisWorker();
  return await worker.getPendingCount();
} 