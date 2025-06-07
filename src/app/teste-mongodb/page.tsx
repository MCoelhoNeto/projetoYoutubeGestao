'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, CheckCircle, AlertCircle, Loader, Play, 
  Server, Clock, Users, RefreshCw, Eye, EyeOff 
} from 'lucide-react';

interface TestResult {
  status: 'success' | 'error';
  message: string;
  connection?: any;
  operations?: any;
  serverInfo?: any;
  timestamp: string;
  environment?: any;
  error?: string;
}

export default function TestMongoDB() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [customUri, setCustomUri] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const runTest = async (useCustomUri = false) => {
    setLoading(true);
    setTestResult(null);

    try {
      // 🔧 CORREÇÃO: URL da API correta
      const url = '/api/test-mongodb';
      const options: RequestInit = {
        method: useCustomUri ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (useCustomUri) {
        options.body = JSON.stringify({ customUri });
      }

      console.log('🔍 Fazendo requisição para:', url);
      console.log('🔍 Método:', options.method);

      const response = await fetch(url, options);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Data recebida:', data);
      
      setTestResult(data);
    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      setTestResult({
        status: 'error',
        message: 'Erro ao executar teste',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // 🧪 Teste automático ao carregar a página
  useEffect(() => {
    console.log('🚀 Componente carregado, executando teste automático...');
    runTest(false);
  }, []);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
      default:
        return <AlertCircle className="text-gray-400" size={24} />;
    }
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getConnectionDetails = () => {
    if (!testResult?.connection) return null;

    // Adaptação para diferentes estruturas de resposta
    const details = testResult.connection.details || testResult.connection;
    
    return {
      database: details?.database || 'N/A',
      host: details?.host || 'localhost',
      port: details?.port || '27017',
      status: details?.status || details?.state || 'unknown'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Database className="text-green-600" />
            Teste de Conexão MongoDB
          </h1>
          <p className="text-gray-600">Verifique a conectividade e funcionamento do banco de dados</p>
        </div>

        {/* Status da Conexão */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader className="text-blue-500 animate-spin" size={20} />
                ) : testResult ? (
                  getStatusIcon(testResult.status)
                ) : (
                  <AlertCircle className="text-gray-400" size={20} />
                )}
                <span className="font-medium">
                  {loading ? 'Testando conexão...' : 
                   testResult?.status === 'success' ? 'MongoDB Conectado' :
                   testResult?.status === 'error' ? 'Erro de Conexão' : 
                   'Aguardando teste'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {testResult && new Date(testResult.timestamp).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Teste Principal */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server size={20} />
            Teste de Conexão Padrão
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => runTest(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Play size={20} />}
              {loading ? 'Testando...' : 'Executar Teste'}
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showDetails ? <EyeOff size={20} /> : <Eye size={20} />}
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
            </button>

            <button
              onClick={() => {
                setTestResult(null);
                console.log('🧹 Resultados limpos');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={20} />
              Limpar
            </button>
          </div>

          {/* Resultado do Teste */}
          {testResult && (
            <div className={`border rounded-lg p-4 ${
              testResult.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(testResult.status)}
                <h3 className="text-lg font-medium">
                  {testResult.status === 'success' ? 'Teste Bem-sucedido!' : 'Falha no Teste'}
                </h3>
              </div>
              
              <p className="text-gray-700 mb-3">{testResult.message}</p>
              
              {/* Informações de Conexão */}
              {testResult.status === 'success' && testResult.connection && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Database size={16} />
                      <span className="font-medium">Banco</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getConnectionDetails()?.database}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Server size={16} />
                      <span className="font-medium">Host</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getConnectionDetails()?.host}:{getConnectionDetails()?.port}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded p-3 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={16} />
                      <span className="font-medium">Status</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getConnectionDetails()?.status}
                    </p>
                  </div>
                </div>
              )}

              {/* Operações CRUD */}
              {testResult.operations && testResult.operations.success && (
                <div className="bg-white rounded p-3 border mb-4">
                  <h4 className="font-medium mb-2">Operações CRUD:</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ Create</span>
                    <span className="text-green-600">✓ Read</span>
                    <span className="text-green-600">✓ Delete</span>
                  </div>
                  {testResult.operations.operations && (
                    <p className="text-xs text-gray-500 mt-1">
                      ID do teste: {testResult.operations.operations.documentId}
                    </p>
                  )}
                </div>
              )}

              {/* Server Info */}
              {testResult.serverInfo && Object.keys(testResult.serverInfo).length > 0 && (
                <div className="bg-white rounded p-3 border mb-4">
                  <h4 className="font-medium mb-2">Informações do Servidor:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {testResult.serverInfo.version && (
                      <div>
                        <span className="font-medium">Versão:</span> {testResult.serverInfo.version}
                      </div>
                    )}
                    {testResult.serverInfo.uptime && (
                      <div>
                        <span className="font-medium">Uptime:</span> {Math.floor(testResult.serverInfo.uptime / 3600)}h
                      </div>
                    )}
                    {testResult.serverInfo.connections && (
                      <div>
                        <span className="font-medium">Conexões:</span> {testResult.serverInfo.connections.current}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Environment Info */}
              {testResult.environment && (
                <div className="bg-white rounded p-3 border mb-4">
                  <h4 className="font-medium mb-2">Ambiente:</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Node ENV:</span> {testResult.environment.nodeEnv}
                    </div>
                    <div>
                      <span className="font-medium">MongoDB URI:</span> {testResult.environment.mongoUri}
                    </div>
                  </div>
                </div>
              )}

              {/* Erro */}
              {testResult.error && (
                <div className="bg-red-100 border border-red-200 rounded p-3 mb-4">
                  <h4 className="font-medium text-red-800 mb-1">Erro:</h4>
                  <p className="text-sm text-red-700">{testResult.error}</p>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Testado em: {new Date(testResult.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Teste com URI Customizada */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Teste com URI Customizada</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MongoDB Connection URI
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={customUri}
                  onChange={(e) => setCustomUri(e.target.value)}
                  placeholder="mongodb://root:123456!@192.168.54.61:27017/youtube_manager_ia?authSource=admin"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Local: mongodb://root:123456!@192.168.54.61:27017/youtube_manager_ia?authSource=admin<br/>
                Atlas: mongodb+srv://user:pass@cluster.mongodb.net/database
              </p>
            </div>
            
            <button
              onClick={() => runTest(true)}
              disabled={loading || !customUri.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Database size={20} />}
              Testar URI Customizada
            </button>
          </div>
        </div>

        {/* Detalhes Técnicos */}
        {showDetails && testResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes Técnicos</h2>
            <div className="bg-gray-100 rounded p-4 overflow-auto">
              <pre className="text-sm text-gray-800">
                {formatJson(testResult)}
              </pre>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Como usar este teste:</h3>
          <div className="space-y-2 text-blue-700">
            <p>• <strong>Teste Padrão:</strong> Usa a URI do arquivo .env.local</p>
            <p>• <strong>Teste Customizado:</strong> Permite testar outras URIs sem alterar configuração</p>
            <p>• <strong>Operações CRUD:</strong> Verifica se consegue criar, ler e deletar documentos</p>
            <p>• <strong>Info do Servidor:</strong> Mostra versão, uptime e conexões ativas</p>
            <p>• <strong>Console:</strong> Abra o DevTools (F12) para ver logs detalhados</p>
          </div>
        </div>
      </div>
    </div>
  );
}