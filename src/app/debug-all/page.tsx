'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@components/layouts/DashboardLayout';
import Button from '@components/ui/button';
import { Loader, RefreshCw } from 'lucide-react';

export default function DebugAllPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDebugData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug-all-channels');
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
        console.log('Debug all data:', data);
      }
    } catch (error) {
      console.error('Erro ao carregar debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-gray-600">
            <Loader className="w-6 h-6 animate-spin" />
            <span>Carregando dados de debug...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Debug Todos os Documentos</h1>
            <Button onClick={loadDebugData} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar</span>
            </Button>
          </div>

          {debugData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Canais */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Canais ({debugData.totalCanais})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugData.canais.map((channel: any, index: number) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <p><strong>Título:</strong> {channel.title}</p>
                      <p><strong>Tem campo:</strong> {channel.hasListInVideos ? '✅' : '❌'}</p>
                      <p><strong>Valor:</strong> {String(channel.listInVideos)}</p>
                      <p><strong>Tipo:</strong> {channel.tipo}</p>
                      <p><strong>Campos:</strong> {channel.campos.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorias */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Categorias ({debugData.totalCategorias})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugData.categorias.map((category: any, index: number) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <p><strong>Nome:</strong> {category.name}</p>
                      <p><strong>Tem campo:</strong> {category.hasListInVideos ? '✅' : '❌'}</p>
                      <p><strong>Valor:</strong> {String(category.listInVideos)}</p>
                      <p><strong>Tipo:</strong> {category.tipo}</p>
                      <p><strong>Campos:</strong> {category.campos.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 