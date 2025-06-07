'use client';

import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown } from 'lucide-react';

export default function PlanUsage() {
  const { 
    user, 
    usagePercentage, 
    getRemainingChannels,
    getRemainingCategories,
    getRemainingAnalyses,
    getPlanName 
  } = useAuth();

  if (!user) return null;

  const isNearLimit = Object.values(usagePercentage).some(p => p > 80);

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Uso do Plano</h3>
        <div className="flex items-center gap-1 text-sm text-blue-600">
          <Crown size={14} />
          {getPlanName()}
        </div>
      </div>

      <div className="space-y-3">
        {/* Canais */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Canais</span>
            <span>{user.usage.channelsCount}/{user.plan.features.maxChannels}</span>
          </div>
          <Progress value={usagePercentage.channels} className="h-2" />
        </div>

        {/* Categorias */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Categorias</span>
            <span>{user.usage.categoriesCount}/{user.plan.features.maxCategories}</span>
          </div>
          <Progress value={usagePercentage.categories} className="h-2" />
        </div>

        {/* Análises */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Análises (mês)</span>
            <span>{user.usage.analysesThisMonth}/{user.plan.features.maxAnalysesPerMonth}</span>
          </div>
          <Progress value={usagePercentage.analyses} className="h-2" />
        </div>
      </div>

      {/* Aviso de limite */}
      {isNearLimit && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Limite próximo</p>
            <p className="text-yellow-700">
              Considere fazer upgrade para continuar usando todos os recursos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}