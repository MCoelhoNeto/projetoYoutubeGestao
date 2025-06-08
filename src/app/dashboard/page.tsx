// /app/dashboard/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@hooks/useAuth';
import AuthGuard from '@components/auth/AuthGuard';
import DashboardLayout from '@components/layouts/DashboardLayout';
import {
  Youtube,
  BarChart3,
  FolderOpen,
  TrendingUp,
  Plus,
  Settings,
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const {
    user,
    getRemainingChannels,
    getRemainingCategories,
    getRemainingAnalyses,
    usagePercentage,
  } = useAuth();

  const router = useRouter();

  const plan = user?.plan ?? {};
  const features = plan?.features ?? {};
  const usage = user?.usage ?? {};

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo de volta, {user.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-gray-600">
          Gerencie seus canais do YouTube e analise conteúdo com IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <InfoCard
          icon={<Youtube className="text-red-600" size={24} />}
          title="Canais"
          count={usage.channelsCount ?? 0}
          remaining={getRemainingChannels()}
          usage={usagePercentage.channels ?? 0}
          color="red"
        />
        <InfoCard
          icon={<FolderOpen className="text-blue-600" size={24} />}
          title="Categorias"
          count={usage.categoriesCount ?? 0}
          remaining={getRemainingCategories()}
          usage={usagePercentage.categories ?? 0}
          color="blue"
        />
        <InfoCard
          icon={<BarChart3 className="text-green-600" size={24} />}
          title="Análises (mês)"
          count={usage.analysesThisMonth ?? 0}
          remaining={getRemainingAnalyses()}
          usage={usagePercentage.analyses ?? 0}
          color="green"
        />
      </div>

      <ActionGrid router={router} />
      <AccountInfo user={user} plan={plan} features={features} />
    </DashboardLayout>
  );
}

function InfoCard({ icon, title, count, remaining, usage, color }: any) {
  const bgColor = {
    red: 'bg-red-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
  }[color];

  const barColor = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
  }[color];

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bgColor} rounded-lg`}>{icon}</div>
        <span className="text-2xl font-bold text-gray-900">{count}</span>
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{remaining} restantes</p>
      <div className="mt-3 bg-gray-200 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${usage}%` }}
        />
      </div>
    </div>
  );
}

function ActionGrid({ router }: any) {
  const actions = [
    {
      title: 'Adicionar Canal',
      description: 'Conecte um novo canal do YouTube',
      icon: <Plus size={20} />,
      color: 'bg-red-600 hover:bg-red-700',
      onClick: () => router.push('/channels/add'),
    },
    {
      title: 'Ver Vídeos',
      description: 'Navegue pelos vídeos dos canais',
      icon: <Youtube size={20} />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => router.push('/videos'),
    },
    {
      title: 'Análises',
      description: 'Veja análises de IA anteriores',
      icon: <TrendingUp size={20} />,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => router.push('/analyses'),
    },
    {
      title: 'Categorias',
      description: 'Gerencie suas categorias de conteúdo',
      icon: <FolderOpen size={20} />,
       color: 'bg-gray-600 hover:bg-gray-700',
      onClick: () => router.push('/categories'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`${action.color} text-white p-6 rounded-lg transition-colors text-left w-full`}
        >
          <div className="mb-3">{action.icon}</div>
          <h3 className="font-medium mb-1">{action.title}</h3>
          <p className="text-sm opacity-90">{action.description}</p>
        </button>
      ))}
    </div>
  );
}

function AccountInfo({ user, plan, features }: any) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-medium text-gray-900 mb-4">Informações da Conta</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Dados Pessoais</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nome:</span>
              <span className="text-gray-900">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="text-gray-900 font-mono text-xs">{user.id}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Plano Atual</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo:</span>
              <span className="text-gray-900 capitalize">{plan?.type ?? 'free'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Canais:</span>
              <span className="text-gray-900">{features?.maxChannels ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Análises/mês:</span>
              <span className="text-gray-900">{features?.maxAnalysesPerMonth ?? 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <details className="mt-6">
        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          Ver dados brutos (debug)
        </summary>
        <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
          {JSON.stringify({ user }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
