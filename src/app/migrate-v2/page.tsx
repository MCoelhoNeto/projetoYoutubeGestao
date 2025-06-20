'use client';

import { useState } from 'react';
import DashboardLayout from '@components/layouts/DashboardLayout';
import Button from '@components/ui/button';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function MigrateV2Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/migrate-list-in-videos-v2', {
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
          <h1 className="text-xl font-bold text-gray-900 mb-4">Migração V2</h1>
          
          <p className="text-gray-600 mb-6">
            Esta migração garante que todos os canais e categorias tenham o campo <code>listInVideos</code> definido corretamente.
          </p>

          <Button 
            onClick={runMigration} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Executando migração...
              </>
            ) : (
              'Executar Migração V2'
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Migração V2 concluída!</span>
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