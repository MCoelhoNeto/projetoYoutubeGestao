'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@components/layouts/DashboardLayout';
import Button from '@components/ui/button';
import { Loader, RefreshCw } from 'lucide-react';

interface DebugData {
  channelId: string;
  lean: {
    _id: string;
    title: string;
    listInVideos: boolean;
    tipo: string;
  };
  normal: {
    _id: string;
    title: string;
    listInVideos: boolean;
    tipo: string;
  };
}

export default function DebugChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDebugData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/debug-channel/${channelId}`);
      if (response.ok) {
        const data = await response.json();
        setDebugData(data.debug);
        console.log('Debug data:', data.debug);
      }
    } catch (error) {
      console.error('Erro ao carregar debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (channelId) {
      loadDebugData();
    }
  }, [channelId]);

  const testToggle = async () => {
    try {
      console.log('Testando toggle...');
      
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listInVideos: false })
      });

      const data = await response.json();
      console.log('Resposta do toggle:', data);

      if (response.ok) {
        // Recarregar dados
        await loadDebugData();
      }
    } catch (error) {
      console.error('Erro no toggle:', error);
    }
  };

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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Debug Canal</h1>
            <div className="flex space-x-2">
              <Button onClick={testToggle}>
                Testar Toggle (false)
              </Button>
              <Button onClick={loadDebugData} className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar</span>
              </Button>
            </div>
          </div>

          {debugData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lean Query */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Lean Query (.lean())</h2>
                <div className="space-y-2 text-sm">
                  <p><strong>ID:</strong> {debugData.lean._id}</p>
                  <p><strong>Título:</strong> {debugData.lean.title}</p>
                  <p><strong>listInVideos:</strong> {String(debugData.lean.listInVideos)}</p>
                  <p><strong>Tipo:</strong> {debugData.lean.tipo}</p>
                </div>
              </div>

              {/* Normal Query */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Normal Query</h2>
                <div className="space-y-2 text-sm">
                  <p><strong>ID:</strong> {debugData.normal._id}</p>
                  <p><strong>Título:</strong> {debugData.normal.title}</p>
                  <p><strong>listInVideos:</strong> {String(debugData.normal.listInVideos)}</p>
                  <p><strong>Tipo:</strong> {debugData.normal.tipo}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Instruções</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Clique em "Testar Toggle" para definir listInVideos como false</li>
              <li>2. Clique em "Recarregar" para ver os dados atualizados</li>
              <li>3. Verifique se o valor foi persistido no banco</li>
              <li>4. Acesse a página de edição do canal para ver se o toggle reflete o valor correto</li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 