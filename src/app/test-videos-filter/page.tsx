'use client';

import { useState, useEffect } from 'react';
import Button from '@components/ui/button';

export default function TestVideosFilterPage() {
  const [videosData, setVideosData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testVideosFilter = async () => {
    setLoading(true);
    setError(null);
    try {
      // Testar API de vídeos
      const videosResponse = await fetch('/api/videos');
      const videosResult = await videosResponse.json();
      setVideosData(videosResult);

      // Testar API de categorias com canais
      const categoriesResponse = await fetch('/api/categories/with-channels');
      const categoriesResult = await categoriesResponse.json();
      setCategoriesData(categoriesResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testVideosFilter();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste do Filtro de Vídeos</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Verificar Filtro listInVideos</h2>
        <p>Esta página testa se o filtro listInVideos está funcionando nas APIs de vídeos.</p>
      </div>

      <Button 
        onClick={testVideosFilter} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? 'Testando...' : 'Testar Filtro'}
      </Button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API de Vídeos */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">API de Vídeos (/api/videos)</h3>
          
          {videosData ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Total de categorias retornadas: {Array.isArray(videosData) ? videosData.length : 'Erro'}
              </p>
              
              {Array.isArray(videosData) && videosData.map((categoria: any, index: number) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold">{categoria.categoriaNome}</h4>
                  <p className="text-sm text-gray-600">
                    Canais: {categoria.canais.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vídeos: {categoria.canais.reduce((total: number, canal: any) => total + canal.videos.length, 0)}
                  </p>
                </div>
              ))}
              
              {!Array.isArray(videosData) && (
                <div className="text-red-600">
                  Erro: {videosData.error || 'Resposta inválida'}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado carregado</p>
          )}
        </div>

        {/* API de Categorias com Canais */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">API de Categorias (/api/categories/with-channels)</h3>
          
          {categoriesData ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Total de categorias retornadas: {categoriesData.categories?.length || 'Erro'}
              </p>
              
              {categoriesData.categories?.map((categoria: any, index: number) => (
                <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                  <h4 className="font-semibold">{categoria.name}</h4>
                  <p className="text-sm text-gray-600">
                    Canais: {categoria.channels.length}
                  </p>
                  <p className="text-sm text-gray-600">
                    listInVideos: {String(categoria.listInVideos)}
                  </p>
                </div>
              ))}
              
              {!categoriesData.categories && (
                <div className="text-red-600">
                  Erro: {categoriesData.error || 'Resposta inválida'}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado carregado</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Como Testar</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Vá para a página de edição de um canal ou categoria</li>
          <li>Desative o toggle "Listar no Vídeos"</li>
          <li>Volte para esta página e clique em "Testar Filtro"</li>
          <li>Verifique se o canal/categoria não aparece mais nas listas</li>
          <li>Vá para <a href="/videos" className="text-blue-600 hover:underline">/videos</a> e confirme que não aparece</li>
        </ol>
      </div>
    </div>
  );
} 