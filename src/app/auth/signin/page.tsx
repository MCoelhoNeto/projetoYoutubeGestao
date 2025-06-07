'use client'
import React, { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Youtube, 
  Chrome, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Verificar se já está logado
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔐 Iniciando login com Google...');
      
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
      
      if (result?.error) {
        console.error('❌ Erro no login:', result.error);
        setError('Erro ao fazer login. Tente novamente.');
      } else if (result?.url) {
        console.log('✅ Login bem-sucedido, redirecionando...');
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <div className="flex min-h-screen">
        {/* Lado Esquerdo - Informações */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8">
          <div className="mx-auto max-w-md">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-red-600 rounded-xl">
                <Youtube className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">YouTube Manager</h1>
                <p className="text-sm text-gray-600">Powered by AI</p>
              </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Analise canais do YouTube com IA
                </h2>
                <p className="text-gray-600">
                  Obtenha resumos inteligentes, tópicos principais e análises técnicas 
                  dos vídeos dos seus canais favoritos.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: <Zap className="text-yellow-600" size={20} />,
                    title: "Análise Instantânea",
                    description: "IA Gemini analisa transcrições completas"
                  },
                  {
                    icon: <TrendingUp className="text-green-600" size={20} />,
                    title: "Insights Avançados", 
                    description: "Resumos, tópicos e opinões técnicas"
                  },
                  {
                    icon: <Users className="text-blue-600" size={20} />,
                    title: "Multi-canais",
                    description: "Organize por categorias e acompanhe vários canais"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Planos */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-blue-600" size={16} />
                <span className="text-sm font-medium text-blue-900">Plano Gratuito</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 3 canais</li>
                <li>• 5 categorias</li>
                <li>• 10 análises/mês</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lado Direito - Login */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            {/* Logo Mobile */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="p-3 bg-red-600 rounded-xl">
                <Youtube className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YouTube Manager IA</h1>
              </div>
            </div>

            {/* Título */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
                Entre na sua conta
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Use sua conta Google para continuar
              </p>
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botão de Login */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                ) : (
                  <Chrome size={20} />
                )}
                {loading ? 'Entrando...' : 'Continuar com Google'}
              </button>

              {/* Informações de Segurança */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield size={12} />
                <span>Login seguro via Google OAuth</span>
              </div>

              {/* Recursos do Plano Gratuito - Mobile */}
              <div className="lg:hidden mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center mb-3">
                  <h3 className="font-medium text-blue-900">Comece gratuitamente</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">3</div>
                    <div className="text-xs text-blue-800">Canais</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">5</div>
                    <div className="text-xs text-blue-800">Categorias</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">10</div>
                    <div className="text-xs text-blue-800">Análises/mês</div>
                  </div>
                </div>
              </div>

              {/* Link para Upgrade */}
              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  Precisa de mais recursos?{' '}
                  <button className="text-red-600 hover:text-red-500 font-medium inline-flex items-center gap-1">
                    Ver planos Premium
                    <ArrowRight size={12} />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}