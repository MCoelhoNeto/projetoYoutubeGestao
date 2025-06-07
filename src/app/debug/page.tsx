'use client'

import React, { useState } from 'react';
import { TestTube, Database, AlertCircle } from 'lucide-react';

export default function SimpleDebugPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string) => {
    setLoading(true);
    setResult('Testando...');
    
    try {
      console.log(`🔍 Testando: ${endpoint}`);
      
      const response = await fetch(endpoint);
      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response headers:`, response.headers);
      
      const text = await response.text();
      console.log(`📦 Response text:`, text);
      
      // Tentar fazer parse como JSON
      let data;
      try {
        data = JSON.parse(text);
        setResult(`✅ Sucesso!\n\n${JSON.stringify(data, null, 2)}`);
      } catch (parseError) {
        setResult(`❌ Erro de JSON Parse!\n\nStatus: ${response.status}\n\nResposta recebida:\n${text.slice(0, 500)}...`);
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      setResult(`❌ Erro de rede!\n\n${error}`);
    }
    
    setLoading(false);
  };

  const testMongoDB = () => testAPI('/api/test-mongodb');
  const testAuth = () => testAPI('/api/auth/providers');
  const testSession = () => testAPI('/api/auth/session');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <TestTube className="mx-auto text-blue-600 mb-4" size={48} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug APIs
          </h1>
          <p className="text-gray-600">
            Teste as APIs para diagnosticar problemas
          </p>
        </div>

        {/* Testes */}
        <div className="space-y-4 mb-8">
          <button
            onClick={testMongoDB}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Database size={20} />
            Testar MongoDB API
          </button>

          <button
            onClick={testAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            🔐 Testar Auth Providers
          </button>

          <button
            onClick={testSession}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            👤 Testar Session
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Testando...</p>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              Resultado:
            </h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}

        {/* URLs para testar manualmente */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">URLs para testar manualmente:</h3>
          <div className="space-y-1 text-sm">
            <a href="/api/test-mongodb" target="_blank" className="text-blue-600 hover:underline block">
              🔗 /api/test-mongodb
            </a>
            <a href="/api/auth/providers" target="_blank" className="text-blue-600 hover:underline block">
              🔗 /api/auth/providers
            </a>
            <a href="/api/auth/session" target="_blank" className="text-blue-600 hover:underline block">
              🔗 /api/auth/session
            </a>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Como usar:</p>
              <ol className="text-yellow-700 space-y-1">
                <li>1. Clique nos botões para testar as APIs</li>
                <li>2. Ou clique nos links para abrir diretamente no navegador</li>
                <li>3. Verifique o console do navegador (F12) para logs detalhados</li>
                <li>4. Se retornar HTML ao invés de JSON = API não existe</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}