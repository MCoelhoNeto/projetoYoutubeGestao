'use client';

import { useState } from 'react';
import Button from '@components/ui/button';

export default function ForceRecompileModelsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRecompile = async () => {
    if (!confirm('Tem certeza que deseja forçar a recompilação dos modelos? Isso irá limpar o cache do Mongoose.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/force-recompile-models', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Forçar Recompilação dos Modelos</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <strong>Atenção!</strong> Esta operação irá limpar o cache do Mongoose e forçar a recompilação dos modelos.
        Isso pode resolver problemas de campos não reconhecidos.
      </div>

      <Button 
        onClick={executeRecompile} 
        disabled={loading}
        className="mb-6 bg-orange-600 hover:bg-orange-700"
      >
        {loading ? 'Recompilando...' : 'Forçar Recompilação dos Modelos'}
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>{result.message}</strong>
          </div>

          {result.testChannel && (
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Teste do Canal Após Recompilação</h3>
              <p><strong>Título:</strong> {result.testChannel.title}</p>
              <p><strong>ID:</strong> {result.testChannel._id}</p>
              <p><strong>Tem campo listInVideos:</strong> {result.testChannel.hasListInVideos ? 'SIM' : 'NÃO'}</p>
              <p><strong>Valor:</strong> {String(result.testChannel.listInVideos)}</p>
              <p><strong>Tipo:</strong> {result.testChannel.tipo}</p>
              <p><strong>Campos:</strong> {result.testChannel.campos.join(', ')}</p>
            </div>
          )}

          {result.testCategory && (
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Teste da Categoria Após Recompilação</h3>
              <p><strong>Nome:</strong> {result.testCategory.name}</p>
              <p><strong>ID:</strong> {result.testCategory._id}</p>
              <p><strong>Tem campo listInVideos:</strong> {result.testCategory.hasListInVideos ? 'SIM' : 'NÃO'}</p>
              <p><strong>Valor:</strong> {String(result.testCategory.listInVideos)}</p>
              <p><strong>Tipo:</strong> {result.testCategory.tipo}</p>
              <p><strong>Campos:</strong> {result.testCategory.campos.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Próximos Passos</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Execute a recompilação dos modelos acima</li>
          <li>Verifique se os campos listInVideos agora são reconhecidos</li>
          <li>Teste o toggle nas páginas de edição de canais e categorias</li>
          <li>Se ainda houver problemas, use a página de <a href="/debug-raw-v2" className="text-blue-600 hover:underline">Debug Raw V2</a> para verificar</li>
        </ol>
      </div>
    </div>
  );
} 