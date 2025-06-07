'use client'

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Chrome, 
  TestTube, 
  AlertTriangle,
  Database,
  Shield,
  Zap
} from 'lucide-react';

export default function TempLoginPage() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Erro:', error);
    }
    setLoading(false);
  };

  const handleTestMongoDB = async () => {
    setTesting(true);
    setTestResult('Testando conexão...');
    
    try {
      const response = await fetch('/api/test-mongodb');
      const result = await response.json();
      console.log(result)
      if (result.status.success) {
        setTestResult('✅ MongoDB funcionando perfeitamente!');
      } else {
        setTestResult(`❌ Erro MongoDB: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Erro de rede: ${error}`);
    }
    
    setTesting(false);
  };

  const handleCreateTestUser = async () => {
    setTesting(true);
    setTestResult('Criando usuário de teste...');
    
    try {
      const response = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@exemplo.com',
          name: 'Usuário Teste',
          image: 'https://via.placeholder.com/150'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult('✅ Usuário teste criado! Você pode testar o dashboard agora.');
      } else {
        setTestResult(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`❌ Erro: ${error}`);
    }
    
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TestTube className="text-yellow-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Página de Debug
          </h1>
          <p className="text-gray-600">
            Teste a autenticação e diagnóstico de problemas
          </p>
        </div>

        {/* Aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Modo Debug Ativo</p>
              <p className="text-yellow-700">
                Esta página é temporária para diagnosticar problemas de autenticação.
              </p>
            </div>
          </div>
        </div>

        {/* Login Google Normal */}
        <div className="bg-white rounded-lg border p-6 mb-4">
          <h2 className="font-medium text-gray-900 mb-3">1. Teste Login Google</h2>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            ) : (
              <Chrome size={20} />
            )}
            {loading ? 'Entrando...' : 'Login com Google'}
          </button>
        </div>

        {/* Teste MongoDB */}
        <div className="bg-white rounded-lg border p-6 mb-4">
          <h2 className="font-medium text-gray-900 mb-3">2. Teste MongoDB</h2>
          <button
            onClick={handleTestMongoDB}
            disabled={testing}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {testing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Database size={20} />
            )}
            {testing ? 'Testando...' : 'Testar Conexão MongoDB'}
          </button>
        </div>

        {/* Criar Usuário Teste */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-3">3. Bypass - Criar Usuário Teste</h2>
          <button
            onClick={handleCreateTestUser}
            disabled={testing}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {testing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Shield size={20} />
            )}
            {testing ? 'Criando...' : 'Criar Usuário de Teste'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Cria um usuário fake para testar o dashboard sem OAuth
          </p>
        </div>

        {/* Resultado dos Testes */}
        {testResult && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Resultado:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}

        {/* Links Úteis */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Links Úteis:</h3>
          <div className="space-y-1 text-sm">
            <a 
              href="https://console.cloud.google.com/apis/credentials/consent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 block"
            >
              🔗 Google Cloud Console (OAuth)
            </a>
            <a 
              href="/auth/signin"
              className="text-blue-600 hover:text-blue-700 block"
            >
              🔗 Página de Login Normal
            </a>
            <a 
              href="/api/auth/providers"
              target="_blank"
              className="text-blue-600 hover:text-blue-700 block"
            >
              🔗 NextAuth Providers (Debug)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}