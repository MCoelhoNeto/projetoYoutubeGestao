"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Tag,
  Calendar,
  ExternalLink,
  Loader,
  Eye,
  Brain,
  FileText,
  X,
  Youtube,
  Folder,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Channel {
  _id: string;
  title: string;
  channelId: string;
}

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface Analysis {
  _id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  transcription: string;
  aiSummary: string;
  status: "processing" | "completed" | "error";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  channelId?: {
    _id: string;
    title: string;
  };
  categoryId?: {
    _id: string;
    name: string;
    color: string;
  };
}

interface SearchFilters {
  query: string;
  categoryId: string;
  channelId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdvancedSearchPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    categoryId: "",
    channelId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChannels(data.channels);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar canais:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const performSearch = async (page = 1, newFilters?: SearchFilters) => {
    const searchFilters = newFilters || filters;
    setSearching(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      // Adicionar filtros apenas se não estiverem vazios
      if (searchFilters.query.trim()) {
        params.append("query", searchFilters.query.trim());
      }
      if (searchFilters.categoryId) {
        params.append("categoryId", searchFilters.categoryId);
      }
      if (searchFilters.channelId) {
        params.append("channelId", searchFilters.channelId);
      }
      if (searchFilters.status) {
        params.append("status", searchFilters.status);
      }
      if (searchFilters.dateFrom) {
        params.append("dateFrom", searchFilters.dateFrom);
      }
      if (searchFilters.dateTo) {
        params.append("dateTo", searchFilters.dateTo);
      }

      const res = await fetch(`/api/analyses/search?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.");
          return;
        }
        throw new Error("Erro ao buscar análises");
      }
      
      const data = await res.json();
      if (data.success) {
        setAnalyses(data.analyses);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || "Erro ao buscar análises");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao buscar análises");
      console.error("Erro ao buscar análises:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    performSearch(1, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      categoryId: "",
      channelId: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    performSearch(1, clearedFilters);
  };

  const handlePageChange = (page: number) => {
    performSearch(page, filters);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-100",
          text: "Concluída",
        };
      case "processing":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bg: "bg-yellow-100",
          text: "Processando",
        };
      case "error":
        return {
          icon: AlertTriangle,
          color: "text-red-500",
          bg: "bg-red-100",
          text: "Erro",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bg: "bg-gray-100",
          text: "Desconhecido",
        };
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, []);

  const totalResults = pagination.total;
  const completedResults = analyses.filter((a) => a.status === "completed").length;
  const processingResults = analyses.filter((a) => a.status === "processing").length;
  const errorResults = analyses.filter((a) => a.status === "error").length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/analyses")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                <div className="hidden sm:block w-px h-6 bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Busca Avançada
                    </h1>
                    <p className="text-sm text-gray-500">
                      {totalResults} resultados encontrados
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-4">
              {/* Main Search */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, conteúdo da análise, transcrição..."
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {showFilters ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </button>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {searching ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Todos os status</option>
                        <option value="completed">Concluídas</option>
                        <option value="processing">Processando</option>
                        <option value="error">Com erro</option>
                      </select>
                    </div>

                    {/* Canal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canal
                      </label>
                      <select
                        value={filters.channelId}
                        onChange={(e) => setFilters({ ...filters, channelId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Todos os canais</option>
                        {channels.map((channel) => (
                          <option key={channel._id} value={channel._id}>
                            {channel.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                      </label>
                      <select
                        value={filters.categoryId}
                        onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Todas as categorias</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Criação
                      </label>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="De"
                        />
                        <input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Até"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {totalResults > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="text-blue-600" size={20} />
                  <span className="text-sm text-blue-600">Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {totalResults}
                </p>
                <p className="text-xs text-blue-700 mt-1">resultados</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-sm text-green-600">Concluídas</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {completedResults}
                </p>
                <p className="text-xs text-green-700 mt-1">finalizadas</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-yellow-600" size={20} />
                  <span className="text-sm text-yellow-600">Processando</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">
                  {processingResults}
                </p>
                <p className="text-xs text-yellow-700 mt-1">em andamento</p>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  <span className="text-sm text-red-600">Com Erro</span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {errorResults}
                </p>
                <p className="text-xs text-red-700 mt-1">falharam</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-gray-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Carregando...</span>
              </div>
            </div>
          )}

          {!loading && !searching && analyses.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Tente ajustar seus critérios de busca
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Filtros
              </button>
            </div>
          )}

          {!loading && analyses.length > 0 && (
            <div className="space-y-6">
              {analyses.map((analysis) => {
                const statusInfo = getStatusInfo(analysis.status);
                return (
                  <div
                    key={analysis._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                              <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {analysis.videoTitle}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Tag className="w-4 h-4 mr-1" />
                                  {analysis.channelName}
                                </span>
                                {analysis.categoryId && (
                                  <span
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: `${analysis.categoryId.color}20`,
                                      color: analysis.categoryId.color,
                                    }}
                                  >
                                    {analysis.categoryId.name}
                                  </span>
                                )}
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
                                  <statusInfo.icon className={`w-3 h-3 mr-1 ${statusInfo.color}`} />
                                  {statusInfo.text}
                                </span>
                              </div>
                            </div>
                          </div>

                          {analysis.status === "completed" && (
                            <div className="mt-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <Brain className="w-4 h-4 mr-2 text-blue-600" />
                                  Resumo da IA
                                </h4>
                                <div className="prose prose-sm max-w-none">
                                  <div
                                    className="text-gray-700 whitespace-pre-line"
                                    style={{ maxHeight: "200px", overflow: "hidden" }}
                                  >
                                    {analysis.aiSummary}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {analysis.status === "error" && analysis.errorMessage && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                                <span className="text-red-800 text-sm">
                                  {analysis.errorMessage}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Criada em: {new Date(analysis.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {analysis.updatedAt !== analysis.createdAt && (
                              <div className="flex items-center space-x-1">
                                <RefreshCw className="w-4 h-4" />
                                <span>
                                  Atualizada em: {new Date(analysis.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => router.push(`/analyses/${analysis._id}`)}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver Detalhes
                          </button>
                          <a
                            href={`https://www.youtube.com/watch?v=${analysis.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            YouTube
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 