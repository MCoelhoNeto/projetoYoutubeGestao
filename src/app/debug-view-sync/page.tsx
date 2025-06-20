'use client';

import { useState } from 'react';
import Button from '@components/ui/button';

export default function DebugViewSyncPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug-view-sync');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug View Sync</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Verificar Sincronização</h2>
        <p>Esta página verifica se os valores da view estão sincronizados com o banco de dados.</p>
      </div>

      <Button 
        onClick={checkSync} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Verificando...' : 'Verificar Sincronização'}
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Resumo</h2>
            <p>Total de Canais: {data.totalChannels}</p>
            <p>Total de Categorias: {data.totalCategories}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Amostra do Banco</h2>
            {data.sampleChannelDB && (
              <div className="mb-4">
                <h3 className="font-semibold">Canal:</h3>
                <p>ID: {data.sampleChannelDB._id}</p>
                <p>Título: {data.sampleChannelDB.title}</p>
                <p>listInVideos: {String(data.sampleChannelDB.listInVideos)}</p>
                <p>Tipo: {data.sampleChannelDB.tipo}</p>
              </div>
            )}
            {data.sampleCategoryDB && (
              <div>
                <h3 className="font-semibold">Categoria:</h3>
                <p>ID: {data.sampleCategoryDB._id}</p>
                <p>Nome: {data.sampleCategoryDB.name}</p>
                <p>listInVideos: {String(data.sampleCategoryDB.listInVideos)}</p>
                <p>Tipo: {data.sampleCategoryDB.tipo}</p>
              </div>
            )}
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Comparação Banco vs API</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left">Título</th>
                    <th className="px-2 py-1 text-left">Banco</th>
                    <th className="px-2 py-1 text-left">API</th>
                    <th className="px-2 py-1 text-left">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparison?.slice(0, 10).map((item: any, index: number) => (
                    <tr key={index} className={`border-t ${item.match ? 'bg-green-50' : 'bg-red-50'}`}>
                      <td className="px-2 py-1">{item.title}</td>
                      <td className="px-2 py-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          item.dbValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {String(item.dbValue)} ({item.dbType})
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          item.apiValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {String(item.apiValue)} ({item.apiType})
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          item.match ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.match ? '✅' : '❌'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.comparison?.length > 10 && (
              <p className="text-sm text-gray-600 mt-2">
                Mostrando apenas os primeiros 10. Total: {data.comparison.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 