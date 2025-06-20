'use client';

import { useState } from 'react';
import Button from '@components/ui/button';

export default function DebugRawV2Page() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug-raw-v2');
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
      <h1 className="text-2xl font-bold mb-6">Debug Raw V2 - Comparação Detalhada</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Comparação MongoDB vs Mongoose</h2>
        <p>Esta página compara como os dados são lidos diretamente do MongoDB vs via Mongoose.</p>
      </div>

      <Button 
        onClick={fetchData} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Carregando...' : 'Buscar Dados Detalhados'}
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
            <p>Total de Canais: {data.totalCanais}</p>
            <p>Total de Categorias: {data.totalCategorias}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Comparação</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Canal</h3>
                <p><strong>Raw tem campo:</strong> {data.comparison.channel.rawHasField ? 'SIM' : 'NÃO'}</p>
                <p><strong>Mongoose tem campo:</strong> {data.comparison.channel.mongooseHasField ? 'SIM' : 'NÃO'}</p>
                <p><strong>Raw valor:</strong> {String(data.comparison.channel.rawValue)} ({data.comparison.channel.rawType})</p>
                <p><strong>Mongoose valor:</strong> {String(data.comparison.channel.mongooseValue)} ({data.comparison.channel.mongooseType})</p>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">Categoria</h3>
                <p><strong>Raw tem campo:</strong> {data.comparison.category.rawHasField ? 'SIM' : 'NÃO'}</p>
                <p><strong>Mongoose tem campo:</strong> {data.comparison.category.mongooseHasField ? 'SIM' : 'NÃO'}</p>
                <p><strong>Raw valor:</strong> {String(data.comparison.category.rawValue)} ({data.comparison.category.rawType})</p>
                <p><strong>Mongoose valor:</strong> {String(data.comparison.category.mongooseValue)} ({data.comparison.category.mongooseType})</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Canal - Dados Brutos (MongoDB)</h2>
            {data.sampleChannelRaw && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">{data.sampleChannelRaw.title}</h3>
                <p><strong>ID:</strong> {data.sampleChannelRaw._id}</p>
                <p><strong>Tem campo listInVideos:</strong> {data.sampleChannelRaw.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p><strong>Valor:</strong> {String(data.sampleChannelRaw.listInVideos)}</p>
                <p><strong>Tipo:</strong> {data.sampleChannelRaw.tipo}</p>
                <p><strong>Campos:</strong> {data.sampleChannelRaw.campos.join(', ')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Dados Completos</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleChannelRaw.rawData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          <div className="bg-orange-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Canal - Dados Mongoose</h2>
            {data.sampleChannelMongoose && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">{data.sampleChannelMongoose.title}</h3>
                <p><strong>ID:</strong> {data.sampleChannelMongoose._id}</p>
                <p><strong>Tem campo listInVideos:</strong> {data.sampleChannelMongoose.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p><strong>Valor:</strong> {String(data.sampleChannelMongoose.listInVideos)}</p>
                <p><strong>Tipo:</strong> {data.sampleChannelMongoose.tipo}</p>
                <p><strong>Campos:</strong> {data.sampleChannelMongoose.campos.join(', ')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">toObject()</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleChannelMongoose.toObject, null, 2)}
                  </pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">toJSON()</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleChannelMongoose.toJSON, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Categoria - Dados Brutos (MongoDB)</h2>
            {data.sampleCategoryRaw && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">{data.sampleCategoryRaw.name}</h3>
                <p><strong>ID:</strong> {data.sampleCategoryRaw._id}</p>
                <p><strong>Tem campo listInVideos:</strong> {data.sampleCategoryRaw.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p><strong>Valor:</strong> {String(data.sampleCategoryRaw.listInVideos)}</p>
                <p><strong>Tipo:</strong> {data.sampleCategoryRaw.tipo}</p>
                <p><strong>Campos:</strong> {data.sampleCategoryRaw.campos.join(', ')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Dados Completos</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleCategoryRaw.rawData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Categoria - Dados Mongoose</h2>
            {data.sampleCategoryMongoose && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold mb-2">{data.sampleCategoryMongoose.name}</h3>
                <p><strong>ID:</strong> {data.sampleCategoryMongoose._id}</p>
                <p><strong>Tem campo listInVideos:</strong> {data.sampleCategoryMongoose.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p><strong>Valor:</strong> {String(data.sampleCategoryMongoose.listInVideos)}</p>
                <p><strong>Tipo:</strong> {data.sampleCategoryMongoose.tipo}</p>
                <p><strong>Campos:</strong> {data.sampleCategoryMongoose.campos.join(', ')}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">toObject()</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleCategoryMongoose.toObject, null, 2)}
                  </pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">toJSON()</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(data.sampleCategoryMongoose.toJSON, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 