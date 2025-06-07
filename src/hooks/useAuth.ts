// src/hooks/useAuth.ts
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export interface UserPlan {
  type: 'free' | 'basic' | 'premium' | 'enterprise';
  features: {
    maxChannels: number;
    maxCategories: number;
    maxAnalysesPerMonth: number;
    priorityProcessing: boolean;
    exportData: boolean;
    advancedFilters: boolean;
  };
}

export interface UserUsage {
  channelsCount: number;
  categoriesCount: number;
  analysesThisMonth: number;
  lastAnalysis: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string;
  plan: UserPlan;
  usage: UserUsage;
}

export function useAuth(requireAuth = true) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user as AuthUser;

  useEffect(() => {
    if (!requireAuth || isLoading) return;

    const isMissingData = !user?.plan || !user?.usage;

     if (!isAuthenticated) {
    router.replace('/auth/signin');
  } else if (isMissingData) {
    console.warn('🔁 Esperando dados do usuário...');
    // aguarda mais um ciclo de render
  }
  }, [requireAuth, isLoading, isAuthenticated, user, router]);

  const canAddChannel = () => {
    return (user?.usage?.channelsCount ?? 0) < (user?.plan?.features?.maxChannels ?? 0);
  };

  const canAddCategory = () => {
    return (user?.usage?.categoriesCount ?? 0) < (user?.plan?.features?.maxCategories ?? 0);
  };

  const canAnalyze = () => {
    return (user?.usage?.analysesThisMonth ?? 0) < (user?.plan?.features?.maxAnalysesPerMonth ?? 0);
  };

  const getRemainingChannels = () => {
    return Math.max(0, (user?.plan?.features?.maxChannels ?? 0) - (user?.usage?.channelsCount ?? 0));
  };

  const getRemainingCategories = () => {
    return Math.max(0, (user?.plan?.features?.maxCategories ?? 0) - (user?.usage?.categoriesCount ?? 0));
  };

  const getRemainingAnalyses = () => {
    return Math.max(0, (user?.plan?.features?.maxAnalysesPerMonth ?? 0) - (user?.usage?.analysesThisMonth ?? 0));
  };

  const getPlanName = () => {
    const planType = user?.plan?.type || 'free';
    const planNames: Record<string, string> = {
      free: 'Gratuito',
      basic: 'Básico',
      premium: 'Premium',
      enterprise: 'Enterprise',
    };
    return planNames[planType] || 'Gratuito';
  };

  const usagePercentage = {
    channels:
      user?.usage?.channelsCount && user?.plan?.features?.maxChannels
        ? (user.usage.channelsCount / user.plan.features.maxChannels) * 100
        : 0,
    categories:
      user?.usage?.categoriesCount && user?.plan?.features?.maxCategories
        ? (user.usage.categoriesCount / user.plan.features.maxCategories) * 100
        : 0,
    analyses:
      user?.usage?.analysesThisMonth && user?.plan?.features?.maxAnalysesPerMonth
        ? (user.usage.analysesThisMonth / user.plan.features.maxAnalysesPerMonth) * 100
        : 0,
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    session,

    canAddChannel,
    canAddCategory,
    canAnalyze,

    getRemainingChannels,
    getRemainingCategories,
    getRemainingAnalyses,
    getPlanName,

    usagePercentage,
  };
}
