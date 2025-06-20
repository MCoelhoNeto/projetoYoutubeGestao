'use client';

import { useState } from 'react';
import Button from '@components/ui/button';

export default function MigrateForceV2Page() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeMigration = async () => {
    if (!confirm('Tem certeza que deseja executar a migração FORCE V2? Isso irá atualizar TODOS os documentos.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-force-v2', {
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
      <h1 className="text-2xl font-bold mb-6">Migração FORCE V2</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <strong>Atenção!</strong> Esta migração irá forçar a atualização de TODOS os documentos de canais e categorias,
        adicionando o campo <code>listInVideos: true</code> em todos eles.
      </div>

      <Button 
        onClick={executeMigration} 
        disabled={loading}
        className="mb-6 bg-red-600 hover:bg-red-700"
      >
        {loading ? 'Executando Migração...' : 'Executar Migração FORCE V2'}
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

          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Resultados da Migração</h2>
            <p><strong>Canais atualizados:</strong> {result.channelsUpdated}</p>
            <p><strong>Categorias atualizadas:</strong> {result.categoriesUpdated}</p>
            <p><strong>Canais com campo:</strong> {result.channelsWithField}</p>
            <p><strong>Categorias com campo:</strong> {result.categoriesWithField}</p>
          </div>

          {result.sampleChannel && (
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Exemplo de Canal</h3>
              <p><strong>Título:</strong> {result.sampleChannel.title}</p>
              <p><strong>ID:</strong> {result.sampleChannel._id}</p>
              <p><strong>Tem campo listInVideos:</strong> {result.sampleChannel.hasListInVideos ? 'SIM' : 'NÃO'}</p>
              <p><strong>Valor:</strong> {String(result.sampleChannel.listInVideos)}</p>
              <p><strong>Campos:</strong> {result.sampleChannel.campos.join(', ')}</p>
            </div>
          )}

          {result.sampleCategory && (
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Exemplo de Categoria</h3>
              <p><strong>Nome:</strong> {result.sampleCategory.name}</p>
              <p><strong>ID:</strong> {result.sampleCategory._id}</p>
              <p><strong>Tem campo listInVideos:</strong> {result.sampleCategory.hasListInVideos ? 'SIM' : 'NÃO'}</p>
              <p><strong>Valor:</strong> {String(result.sampleCategory.listInVideos)}</p>
              <p><strong>Campos:</strong> {result.sampleCategory.campos.join(', ')}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Próximos Passos</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Execute a migração FORCE V2 acima</li>
          <li>Verifique os resultados</li>
          <li>Teste o toggle nas páginas de edição de canais e categorias</li>
          <li>Se ainda houver problemas, use a página de <a href="/debug-raw" className="text-blue-600 hover:underline">Debug Raw</a> para investigar</li>
        </ol>
      </div>
    </div>
  );
} 