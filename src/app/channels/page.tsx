// /app/channels/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@components/ui/button';
import DashboardLayout from '@components/layouts/DashboardLayout';
import {
  ArrowLeft, Youtube, Search, Filter, Plus, ExternalLink, Users, Video, Calendar, CheckCircle, Clock, AlertTriangle,
  Archive, ChevronDown, ChevronRight, BarChart3, Tag, Globe, Eye, Loader, TrendingUp, Hash, Play
} from 'lucide-react';

interface Channel {
  _id: string;
  youtubeChannelId: string;
  title: string;
  description?: string;
  customUrl?: string;
  country?: string;
  publishedAt?: string;
  subscribers?: string;
  totalViews?: string;
  totalVideos?: number;
  thumbnail?: string;
  cacheStatus?: 'fresh' | 'stale' | 'empty';
  analysisCount?: number;
  maxAnalysis?: number;
  lastAnalysis?: string;
  categoryId?: string;
}

interface Category {
  _id: string;
  name: string;
  color?: string;
  channels: Channel[];
}

export default function ChannelsListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/categories/with-channels');
        if (!res.ok) throw new Error('Erro ao buscar categorias');
        const data = await res.json();
        const categoriesWithChannels: Category[] = data.categories.map((cat: any) => ({
          ...cat,
          channels: cat.channels || [],
        }));
        setCategories(categoriesWithChannels);
        setExpandedCategories(new Set(categoriesWithChannels.map(cat => cat._id)));
      } catch (error: any) {
        toast.error(error.message || 'Erro ao carregar canais');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const normalizeText = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

  const filteredCategories = categories.map(category => ({
    ...category,
    channels: category.channels
      .filter(channel => {
        const normSearch = normalizeText(searchTerm);
        const normTitle = normalizeText(channel.title);
        const normDesc = normalizeText(channel.description || '');
        const matchSearch = normTitle.includes(normSearch) || normDesc.includes(normSearch);
        const matchCat = selectedCategory === 'all' || category._id === selectedCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  })).filter(category => selectedCategory === 'all' || category._id === selectedCategory || category.channels.length > 0);

  const totalChannels = categories.reduce((sum, c) => sum + c.channels.length, 0);
  const totalActive = categories.reduce((sum, c) => sum + c.channels.filter(ch => ch.cacheStatus === 'fresh').length, 0);
  const totalSubscribers = categories.reduce((sum, cat) => sum + cat.channels.reduce((csum, ch) => {
    const num = ch.subscribers?.replace(/[KM]/g, m => m === 'K' ? '000' : '000000').replace(/\./g, '') || '0';
    return csum + parseInt(num);
  }, 0), 0);

  const formatNumber = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : n.toString();


 const toggleCategoryExpansion = (id: string) => {
    const copy = new Set(expandedCategories);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setExpandedCategories(copy);
  };

  const toggleChannelDetails = (id: string) => {
    const copy = new Set(expandedChannels);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setExpandedChannels(copy);
  };

  // Expande todas as categorias
const expandAllCategories = () => {
  const allCategoryIds = categories.map((cat) => cat._id);
  setExpandedCategories(new Set(allCategoryIds));
};

// Recolhe todas as categorias
const collapseAllCategories = () => {
  setExpandedCategories(new Set());
};


  const getCacheStatusInfo = (status?: string) => {
    switch (status) {
      case 'fresh': return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', text: 'Atualizado' };
      case 'stale': return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'Desatualizado' };
      case 'empty': default:
        return { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-100', text: 'Vazio' };
    }
  };

 

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
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Youtube className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Todos os Canais</h1>
                    <p className="text-sm text-gray-500">{totalChannels} canais • {formatNumber(totalSubscribers)} inscritos total</p>
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
                    placeholder="Buscar canais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-64"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hidden sm:block w-px h-6 bg-gray-300" />
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={expandAllCategories}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expandir
                  </button>
                  <button
                    onClick={collapseAllCategories}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Retrair
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/channels/add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Canal
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
                <span>Carregando canais...</span>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Youtube className="text-red-600" size={20} />
                    <span className="text-sm text-red-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{totalChannels}</p>
                  <p className="text-xs text-red-700 mt-1">canais</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-sm text-green-600">Ativos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{totalActive}</p>
                  <p className="text-xs text-green-700 mt-1">atualizados</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="text-blue-600" size={20} />
                    <span className="text-sm text-blue-600">Inscritos</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(totalSubscribers)}</p>
                  <p className="text-xs text-blue-700 mt-1">total</p>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="text-purple-600" size={20} />
                    <span className="text-sm text-purple-600">Categorias</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{categories.length}</p>
                  <p className="text-xs text-purple-700 mt-1">ativas</p>
                </div>
              </div>

              {/* Categories and Channels */}
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum canal encontrado</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm ? 'Tente uma busca diferente' : 'Adicione seu primeiro canal'} ou ajuste os filtros.
                  </p>
                  <button
                    onClick={() => router.push('/channels/add')}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Canal
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredCategories.map((category) => (
                    <div key={category._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Category Header */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <button
                          onClick={() => toggleCategoryExpansion(category._id)}
                          className="flex items-center justify-between w-full text-left hover:bg-gray-50 transition-colors -mx-2 px-2 py-1 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: category.color || '#6B7280' }}
                            >
                              <Tag className="w-5 h-5" />
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                              <p className="text-sm text-gray-500">
                                {category.channels.length} canais
                              </p>
                            </div>
                          </div>
                          {expandedCategories.has(category._id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Channels List */}
                      {expandedCategories.has(category._id) && (
                        <div className="p-6">
                          {category.channels.length === 0 ? (
                            <div className="text-center py-8">
                              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum canal nesta categoria</h3>
                              <p className="text-xs text-gray-500">Adicione canais a esta categoria</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {category.channels.map((channel) => {
                                const cacheInfo = getCacheStatusInfo(channel.cacheStatus);
                                const isExpanded = expandedChannels.has(channel._id);
                                
                                return (
                                  <div
                                    key={channel._id}
                                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                                  >
                                    {/* Channel Header */}
                                    <div className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {channel.thumbnail ? (
                                              <img
                                                src={channel.thumbnail}
                                                alt={channel.title}
                                                className="w-full h-full object-cover rounded-lg"
                                              />
                                            ) : (
                                              <Youtube className="w-8 h-8 text-white" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                              <div>
                                                <h4 className="font-semibold text-gray-900 mb-1">{channel.title}</h4>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                  {channel.description || 'Sem descrição disponível'}
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                  <div className="flex items-center space-x-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{channel.subscribers || 'N/A'}</span>
                                                  </div>
                                                  <div className="flex items-center space-x-1">
                                                    <Video className="w-4 h-4" />
                                                    <span>{channel.totalVideos || 0} vídeos</span>
                                                  </div>
                                                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${cacheInfo.bg}`}>
                                                    <cacheInfo.icon className={`w-3 h-3 ${cacheInfo.color}`} />
                                                    <span className={cacheInfo.color}>{cacheInfo.text}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                          <a
                                            href={`https://youtube.com/@${channel.customUrl || channel.youtubeChannelId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Abrir canal no YouTube"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                          <button
                                            onClick={() => toggleChannelDetails(channel._id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Ver detalhes"
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="w-4 h-4" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Channel Details */}
                                    {isExpanded && (
                                      <details open className="border-t border-gray-200">
                                        <summary className="hidden"></summary>
                                        <div className="p-4 bg-gray-50">
                                          <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                Estatísticas
                                              </h5>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Inscritos:</span>
                                                  <span className="font-medium">{channel.subscribers || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Visualizações:</span>
                                                  <span className="font-medium">{channel.totalViews || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Total de vídeos:</span>
                                                  <span className="font-medium">{channel.totalVideos || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">País:</span>
                                                  <span className="font-medium">{channel.country || 'N/A'}</span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Análises
                                              </h5>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Realizadas:</span>
                                                  <span className="font-medium">{channel.analysisCount || 0}/{channel.maxAnalysis || 10}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Última análise:</span>
                                                  <span className="font-medium">
                                                    {channel.lastAnalysis 
                                                      ? new Date(channel.lastAnalysis).toLocaleDateString() 
                                                      : 'Nunca'
                                                    }
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">Criado em:</span>
                                                  <span className="font-medium">
                                                    {channel.publishedAt 
                                                      ? new Date(channel.publishedAt).toLocaleDateString() 
                                                      : 'N/A'
                                                    }
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-600">ID do canal:</span>
                                                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border">
                                                    {channel.youtubeChannelId}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2">
                                                <Tag className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">
                                                  Categoria: <span className="font-medium" style={{ color: category.color }}>{category.name}</span>
                                                </span>
                                              </div>
                                              
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={() => router.push(`/channels/${channel._id}/edit`)}
                                                  className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                  <Eye className="w-3 h-3 mr-1" />
                                                  Atualizar
                                                </button>
                                                <a
                                                  href={`https://youtube.com/@${channel.customUrl || channel.youtubeChannelId}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                  <Play className="w-3 h-3 mr-1" />
                                                  YouTube
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}