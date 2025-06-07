'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case 'AccessDenied':
        return {
          title: 'Acesso Negado pelo Google',
          description: 'O Google negou o acesso à sua conta.',
          solutions: [
            'Verifique se seu email está autorizado no Google Cloud Console',
            'Se o app estiver em modo "Testing", adicione seu email aos Test Users',
            'Ou publique o app no Google Console para permitir qualquer usuário'
          ],
          color: 'red'
        };
      case 'Configuration':
        return {
          title: 'Erro de Configuração',
          description: 'Há um problema na configuração do OAuth.',
          solutions: [
            'Verifique se GOOGLE_CLIENT_ID está correto',
            'Verifique se GOOGLE_CLIENT_SECRET está correto',
            'Confirme se as URLs de redirect estão configuradas'
          ],
          color: 'orange'
        };
      default:
        return {
          title: 'Erro de Autenticação',
          description: `Erro: ${errorCode || 'Não especificado'}`,
          solutions: [
            'Tente fazer login novamente',
            'Verifique sua conexão com a internet',
            'Entre em contato com o suporte se o erro persistir'
          ],
          color: 'gray'
        };
    }
  };

  const errorInfo = getErrorDetails(error);

  const handleRetry = () => {
    router.push('/auth/signin');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        {/* Error Code */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Código do erro: </span>
            <code className="bg-white px-2 py-1 rounded text-red-600 font-mono">
              {error || 'Unknown'}
            </code>
          </div>
        </div>

        {/* Solutions */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="font-medium text-gray-900 mb-3">Possíveis soluções:</h2>
          <ul className="space-y-2">
            {errorInfo.solutions.map((solution, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                {solution}
              </li>
            ))}
          </ul>
        </div>

        {/* Para erro AccessDenied - instruções específicas */}
        {error === 'AccessDenied' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              🔧 Como resolver AccessDenied:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Vá para <strong>Google Cloud Console</strong></li>
              <li>2. <strong>APIs & Services</strong> → <strong>OAuth consent screen</strong></li>
              <li>3. Se estiver "Testing" → <strong>Add Test Users</strong> → Adicione seu email</li>
              <li>4. Ou clique <strong>"PUBLISH APP"</strong> para permitir qualquer usuário</li>
            </ol>
            <a 
              href="https://console.cloud.google.com/apis/credentials/consent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Abrir Google Console
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Debug Info */}
        <details className="bg-gray-100 rounded-lg p-4 mb-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Informações de debug
          </summary>
          <div className="mt-3 text-xs">
            <div className="bg-white p-3 rounded border font-mono">
              <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</div>
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Início
          </button>
        </div>

        {/* Help */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Se o problema persistir, verifique o console do navegador (F12) 
            para mais detalhes.
          </p>
        </div>
      </div>
    </div>
  );
}