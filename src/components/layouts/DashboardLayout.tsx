'use client';

import { useAuth } from '@hooks/useAuth';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Youtube,
  LogOut,
  Crown,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const {
    user,
    getPlanName,
  } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (!user || status === 'loading') return <p>Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <Youtube className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">YouTube Manager</h1>
                <p className="text-xs text-gray-500">Powered by AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <Crown size={14} />
                {getPlanName()}
              </div>

              <div className="flex items-center gap-3">
                <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
