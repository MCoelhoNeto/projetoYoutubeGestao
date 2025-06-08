// /app/categories/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@components/ui/button';
import { CategoryService } from '@lib/services/categoryService';
import { toast } from 'sonner';
import type { Category } from '@lib/services/categoryService';
import {
  Youtube,
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader,
  FolderPlus,
  Tag,
  Users,
  Calendar,
  Hash,
  Edit3,
  Trash2,
  MoreVertical,
  Grid3X3,
  List,
  Filter,
  Archive,
  Folder,
  Settings,
  Eye
} from "lucide-react";
import DashboardLayout from '@components/layouts/DashboardLayout';

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    CategoryService.list()
      .then(setCategories)
      .catch((err) => {
        console.error('Erro ao carregar categorias:', err);
        toast.error('Erro ao carregar categorias');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await CategoryService.remove(id);
        setCategories(categories.filter(cat => cat._id !== id));
        toast.success('Categoria deletada com sucesso');
      } catch (err) {
        console.error('Erro ao deletar categoria:', err);
        toast.error('Erro ao deletar categoria');
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColor = (cat: any) => {
    if (cat.color) return cat.color;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
    return colors[cat.name.length % colors.length];
  };

  const totalChannels = categories.reduce((sum, cat: any) => sum + (cat.channelsCount || 0), 0);

  const recentCategoriesCount = categories.filter((cat: any) => {
    const created = new Date(cat.createdAt || Date.now());
    const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  const activeCategoriesCount = categories.filter((cat: any) => cat.channelsCount > 0).length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
    
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                <div className="hidden sm:block w-px h-6 bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Gerenciar Categorias</h1>
                    <p className="text-sm text-gray-500">{categories.length} categorias • {totalChannels} canais total</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg transition-colors ${!viewMode || viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/categories/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-gray-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Carregando categorias...</span>
              </div>
            </div>
          )}

          {!loading && filteredCategories.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-500">Tente uma busca diferente ou crie uma nova categoria.</p>
            </div>
          )}

          {!loading && categories.length === 0 && !searchTerm && (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria criada</h3>
              <p className="text-gray-500 mb-6">Crie sua primeira categoria para organizar seus canais do YouTube.</p>
              <button
                onClick={() => router.push('/categories/new')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Categoria
              </button>
            </div>
          )}

          {!loading && filteredCategories.length > 0 && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Folder className="text-blue-600" size={20} />
                    <span className="text-sm text-blue-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {categories.length}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">categorias</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="text-red-600" size={20} />
                    <span className="text-sm text-red-600">Canais</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {totalChannels}
                  </p>
                  <p className="text-xs text-red-700 mt-1">total</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-sm text-green-600">Ativas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {categories.filter((cat: any) => cat.channelsCount > 0).length}
                  </p>
                  <p className="text-xs text-green-700 mt-1">com canais</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-purple-600" size={20} />
                    <span className="text-sm text-purple-600">Recentes</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {categories.filter((cat: any) => {
                      const created = new Date(cat.createdAt || cat.updatedAt || Date.now());
                      const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
                      return daysDiff <= 7;
                    }).length}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">esta semana</p>
                </div>
              </div>

              {/* Categories List */}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {filteredCategories.map((cat: any) => (
                  <div
                    key={cat._id}
                    className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group ${
                      viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
                    }`}
                  >
                    {viewMode === 'list' ? (
                      // List Mode
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: getColor(cat) }}
                          >
                            <Tag className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Youtube className="w-4 h-4" />
                                <span>{cat.channelsCount || 0} canais</span>
                              </div>
                              {cat.createdAt && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(cat.createdAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/categories/${cat._id}/edit`)}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Deletar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Grid Mode
                      <div className="text-center">
                        <div className="relative mb-4">
                          <div 
                            className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: getColor(cat) }}
                          >
                            <Tag className="w-8 h-8" />
                          </div>
                          {(cat.channelsCount || 0) > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2">{cat.name}</h3>
                        
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex items-center justify-center space-x-1">
                            <Youtube className="w-4 h-4" />
                            <span>{cat.channelsCount  || 0} canais</span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">{cat.description}</p>
                          )}
                          {cat.createdAt && (
                            <div className="flex items-center justify-center space-x-1 text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>Criada em {new Date(cat.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => router.push(`/categories/${cat._id}/edit`)}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
                            className="px-3 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}