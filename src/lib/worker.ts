import { getAnalysisWorker } from '../workers/analysisWorker';

let workerStarted = false;

export function startAnalysisWorker() {
  console.log('🔧 startAnalysisWorker - Iniciando...');
  console.log('🔧 startAnalysisWorker - workerStarted:', workerStarted);
  console.log('🔧 startAnalysisWorker - ENABLE_WORKER:', process.env.ENABLE_WORKER);
  console.log('🔧 startAnalysisWorker - NODE_ENV:', process.env.NODE_ENV);
  
  if (workerStarted) {
    console.log('⚠️ Worker já foi iniciado');
    return;
  }

  // Iniciar o worker se ENABLE_WORKER estiver definido ou em produção
  if (process.env.ENABLE_WORKER === 'true' || process.env.NODE_ENV === 'production') {
    console.log('🚀 Iniciando Analysis Worker...');
    
    try {
      const worker = getAnalysisWorker();
      console.log('🔧 Worker obtido, iniciando...');
      
      worker.start().catch((error: Error) => {
        console.error('❌ Erro ao iniciar worker:', error);
      });
      
      workerStarted = true;
      console.log('✅ Worker marcado como iniciado');
    } catch (error) {
      console.error('❌ Erro ao obter ou iniciar worker:', error);
    }
  } else {
    console.log('⏸️ Worker não iniciado. Defina ENABLE_WORKER=true no .env.local para habilitar');
    console.log('⏸️ Condições não atendidas:');
    console.log('⏸️ - ENABLE_WORKER === "true":', process.env.ENABLE_WORKER === 'true');
    console.log('⏸️ - NODE_ENV === "production":', process.env.NODE_ENV === 'production');
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