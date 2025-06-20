'use client';

import { useState } from 'react';
import DashboardLayout from '@components/layouts/DashboardLayout';
import Button from '@components/ui/button';
import { Loader, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export default function MigrateForcePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    if (!confirm('⚠️ ATENÇÃO: Esta migração irá atualizar TODOS os canais e categorias. Continuar?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/migrate-force', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erro na migração');
      }
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao executar migração');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Migração FORCE</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm font-medium mb-2">⚠️ ATENÇÃO</p>
            <p className="text-red-700 text-sm">
              Esta migração irá forçar a atualização de <strong>TODOS</strong> os canais e categorias, 
              definindo <code>listInVideos: true</code> em todos os documentos.
            </p>
          </div>

          <Button 
            onClick={runMigration} 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Executando migração FORCE...
              </>
            ) : (
              'Executar Migração FORCE'
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Migração FORCE concluída!</span>
              </div>
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>Canais atualizados: {result.canaisAtualizados}</p>
                <p>Categorias atualizadas: {result.categoriasAtualizadas}</p>
                <p>Total de canais: {result.totalCanais}</p>
                <p>Canais com campo: {result.canaisComCampo}</p>
                <p>Total de categorias: {result.totalCategorias}</p>
                <p>Categorias com campo: {result.categoriasComCampo}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">Erro na migração</span>
              </div>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 