'use client';

import { useState, useEffect } from 'react';
import Button from '@components/ui/button';

export default function DebugRawPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug-raw');
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
      <h1 className="text-2xl font-bold mb-6">Debug Raw - Dados Brutos do MongoDB</h1>
      
      <Button 
        onClick={fetchData} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Carregando...' : 'Buscar Dados Brutos'}
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Resumo</h2>
            <p>Total de Canais: {data.totalCanais}</p>
            <p>Total de Categorias: {data.totalCategorias}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Amostra de Canal</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(data.sampleChannel, null, 2)}
            </pre>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Amostra de Categoria</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(data.sampleCategory, null, 2)}
            </pre>
          </div>

          <div className="bg-purple-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Primeiros 3 Canais (Debug)</h2>
            {data.canais.map((canal: any, index: number) => (
              <div key={index} className="mb-4 p-3 bg-white rounded border">
                <h3 className="font-semibold">{canal.title}</h3>
                <p>ID: {canal._id}</p>
                <p>Tem campo listInVideos: {canal.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p>Valor: {String(canal.listInVideos)}</p>
                <p>Tipo: {canal.tipo}</p>
                <p>Campos: {canal.campos.join(', ')}</p>
              </div>
            ))}
          </div>

          <div className="bg-orange-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Primeiras 3 Categorias (Debug)</h2>
            {data.categorias.map((categoria: any, index: number) => (
              <div key={index} className="mb-4 p-3 bg-white rounded border">
                <h3 className="font-semibold">{categoria.name}</h3>
                <p>ID: {categoria._id}</p>
                <p>Tem campo listInVideos: {categoria.hasListInVideos ? 'SIM' : 'NÃO'}</p>
                <p>Valor: {String(categoria.listInVideos)}</p>
                <p>Tipo: {categoria.tipo}</p>
                <p>Campos: {categoria.campos.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 