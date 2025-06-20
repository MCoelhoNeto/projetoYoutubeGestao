'use client';

import { useState, useEffect } from 'react';
import Button from '@components/ui/button';

export default function DebugToggleTestPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setChannels(data.channels || []);
      if (data.channels && data.channels.length > 0) {
        setSelectedChannel(data.channels[0]._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const testToggle = async (newValue: boolean) => {
    if (!selectedChannel) {
      alert('Selecione um canal primeiro');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('=== TESTE TOGGLE ===');
      console.log('Canal selecionado:', selectedChannel);
      console.log('Novo valor:', newValue);

      const response = await fetch('/api/debug-toggle-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedChannel,
          newValue: newValue
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Resposta do teste:', data);

      alert(`Teste concluído!\n\nANTES: ${data.before.listInVideos} (${data.before.tipo})\nDEPOIS: ${data.after.listInVideos} (${data.after.tipo})`);

      // Recarregar canais para ver a mudança
      await loadChannels();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const selectedChannelData = channels.find(c => c._id === selectedChannel);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Toggle Test</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Instruções</h2>
        <p>Esta página permite testar especificamente o toggle do campo <code>listInVideos</code>.</p>
        <p>Selecione um canal e clique nos botões para testar a mudança de valor.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Selecionar Canal</h3>
          
          <select 
            value={selectedChannel} 
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          >
            {channels.map(channel => (
              <option key={channel._id} value={channel._id}>
                {channel.title} (listInVideos: {String(channel.listInVideos)})
              </option>
            ))}
          </select>

          {selectedChannelData && (
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Canal Selecionado:</h4>
              <p><strong>Título:</strong> {selectedChannelData.title}</p>
              <p><strong>ID:</strong> {selectedChannelData._id}</p>
              <p><strong>listInVideos:</strong> {String(selectedChannelData.listInVideos)}</p>
              <p><strong>Tipo:</strong> {typeof selectedChannelData.listInVideos}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Testar Toggle</h3>
          
          <div className="space-y-4">
            <Button 
              onClick={() => testToggle(true)}
              disabled={loading || !selectedChannel}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Testando...' : 'Definir como TRUE'}
            </Button>

            <Button 
              onClick={() => testToggle(false)}
              disabled={loading || !selectedChannel}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Testando...' : 'Definir como FALSE'}
            </Button>

            <Button 
              onClick={() => testToggle(!selectedChannelData?.listInVideos)}
              disabled={loading || !selectedChannel}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Testando...' : 'Inverter Valor'}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded">
            <h4 className="font-semibold mb-2">Logs do Console</h4>
            <p className="text-sm text-gray-600">
              Abra o console do navegador (F12) para ver os logs detalhados do teste.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Lista de Canais</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">listInVideos</th>
                <th className="px-4 py-2 text-left">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(channel => (
                <tr key={channel._id} className="border-t">
                  <td className="px-4 py-2">{channel.title}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{channel._id}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      channel.listInVideos ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {String(channel.listInVideos)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">{typeof channel.listInVideos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 