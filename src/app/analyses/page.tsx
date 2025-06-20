"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  BarChart3,
  Tag,
  Calendar,
  ExternalLink,
  Loader,
  Eye,
  Brain,
  FileText,
  Plus,
  X,
  Youtube,
  Folder,
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [workerStatus, setWorkerStatus] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoInfo, setVideoInfo] = useState<any>(null);

  const router = useRouter();

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

  const fetchAnalyses = async (page = 1, status = "all", channel = "all", videoId = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      
      if (status !== "all") {
        params.append("status", status);
      }

      if (channel !== "all") {
        params.append("channelId", channel);
      }

      if (videoId) {
        params.append("videoId", videoId);
      }

      const res = await fetch(`/api/analyses?${params}`);
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
        throw new Error(data.error || "Erro ao carregar análises");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar análises");
      console.error("Erro ao buscar análises:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const res = await fetch('/api/worker/status');
      if (res.ok) {
        const data = await res.json();
        setWorkerStatus(data);
      }
    } catch (error) {
      console.error("Erro ao buscar status do worker:", error);
    }
  };

  useEffect(() => {
    // Verificar se há videoId na URL
    const urlParams = new URLSearchParams(window.location.search);
    const videoIdFromUrl = urlParams.get('videoId');
    
    fetchChannels();
    fetchCategories();
    fetchAnalyses(1, "all", "all", videoIdFromUrl || "");
    fetchWorkerStatus();
  }, []);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    fetchAnalyses(1, status, channelFilter);
  };

  const handleChannelFilter = (channel: string) => {
    setChannelFilter(channel);
    fetchAnalyses(1, statusFilter, channel);
  };

  const handlePageChange = (page: number) => {
    fetchAnalyses(page, statusFilter, channelFilter);
  };

  // Extrair videoId da URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Buscar informações do vídeo
  const fetchVideoInfo = async (videoId: string) => {
    try {
      const res = await fetch(`/api/youtube/video-info?videoId=${videoId}`);
      if (!res.ok) throw new Error('Erro ao buscar informações do vídeo');
      
      const data = await res.json();
      if (data.success) {
        return data.videoInfo;
      }
      throw new Error(data.error || 'Vídeo não encontrado');
    } catch (error) {
      console.error('Erro ao buscar vídeo:', error);
      return null;
    }
  };

  // Validar URL e buscar informações do vídeo
  const handleUrlChange = async (url: string) => {
    setVideoUrl(url);
    setVideoInfo(null);
    
    if (url.trim()) {
      const videoId = extractVideoId(url);
      if (videoId) {
        const info = await fetchVideoInfo(videoId);
        setVideoInfo(info);
      }
    }
  };

  // Criar nova análise
  const handleCreateAnalysis = async () => {
    if (!videoUrl.trim()) {
      toast.error("URL do vídeo é obrigatória");
      return;
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      toast.error("URL do YouTube inválida");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          videoTitle: videoInfo?.title || 'Vídeo do YouTube',
          channelId: selectedChannel || undefined,
          categoryId: selectedCategory || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao criar análise");
      }

      const data = await res.json();
      toast.success("Análise criada com sucesso!");
      setShowModal(false);
      setVideoUrl("");
      setSelectedChannel("");
      setSelectedCategory("");
      setVideoInfo(null);
      
      // Recarregar análises
      fetchAnalyses(1, statusFilter, channelFilter);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar análise");
    } finally {
      setIsSubmitting(false);
    }
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

  const filteredAnalyses = analyses.filter((analysis) => {
    const normSearch = searchTerm.toLowerCase();
    const normTitle = analysis.videoTitle.toLowerCase();
    const normChannel = analysis.channelName.toLowerCase();
    return normTitle.includes(normSearch) || normChannel.includes(normSearch);
  });

  const totalAnalyses = analyses.length;
  const completedAnalyses = analyses.filter((a) => a.status === "completed").length;
  const processingAnalyses = analyses.filter((a) => a.status === "processing").length;
  const errorAnalyses = analyses.filter((a) => a.status === "error").length;

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
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Análises de Vídeos
                    </h1>
                    <p className="text-sm text-gray-500">
                      {totalAnalyses} análises • {completedAnalyses} concluídas
                      {workerStatus && (
                        <span className="ml-2">
                          • Worker: {workerStatus.worker.isRunning ? '🟢 Ativo' : '🔴 Inativo'}
                          {workerStatus.worker.isRunning && workerStatus.worker.processingCount > 0 && (
                            <span className="text-blue-600"> ({workerStatus.worker.processingCount} processando)</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botão Nova Análise */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push("/analyses/search")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Busca Avançada
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Análise
                </button>
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
                    placeholder="Buscar análises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white w-64"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value="all">Todos os status</option>
                    <option value="completed">Concluídas</option>
                    <option value="processing">Processando</option>
                    <option value="error">Com erro</option>
                  </select>
                </div>

                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={channelFilter}
                    onChange={(e) => handleChannelFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value="all">Todos os canais</option>
                    {channels.map((channel) => (
                      <option key={channel._id} value={channel._id}>
                        {channel.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchAnalyses(pagination.page, statusFilter, channelFilter)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-purple-600" size={20} />
                <span className="text-sm text-purple-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {totalAnalyses}
              </p>
              <p className="text-xs text-purple-700 mt-1">análises</p>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-sm text-green-600">Concluídas</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {completedAnalyses}
              </p>
              <p className="text-xs text-green-700 mt-1">finalizadas</p>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-yellow-600" size={20} />
                <span className="text-sm text-yellow-600">Processando</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {processingAnalyses}
              </p>
              <p className="text-xs text-yellow-700 mt-1">em andamento</p>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-red-600" size={20} />
                <span className="text-sm text-red-600">Com Erro</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {errorAnalyses}
              </p>
              <p className="text-xs text-red-700 mt-1">falharam</p>
            </div>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-gray-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Carregando análises...</span>
              </div>
            </div>
          )}

          {!loading && filteredAnalyses.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma análise encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "Tente uma busca diferente"
                  : "Nenhuma análise foi realizada ainda"}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Análise
              </button>
            </div>
          )}

          {!loading && filteredAnalyses.length > 0 && (
            <div className="space-y-6">
              {filteredAnalyses.map((analysis) => {
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
                                  <Brain className="w-4 h-4 mr-2 text-purple-600" />
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
                            className="inline-flex items-center px-3 py-1 border border-purple-300 text-xs font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
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

        {/* Modal Nova Análise */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-purple-600" />
                    Nova Análise
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* URL do Vídeo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Vídeo do YouTube
                    </label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Informações do Vídeo */}
                  {videoInfo && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Informações do Vídeo</h3>
                      <p className="text-sm text-gray-700 mb-2">{videoInfo.title}</p>
                      <p className="text-xs text-gray-500">{videoInfo.channelTitle}</p>
                    </div>
                  )}

                  {/* Canal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canal (Opcional)
                    </label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Sem canal específico</option>
                      {channels.map((channel) => (
                        <option key={channel._id} value={channel._id}>
                          {channel.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Categoria (Opcional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria (Opcional)
                    </label>
                    <div className="relative">
                      <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Sem categoria</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateAnalysis}
                    disabled={!videoUrl.trim() || isSubmitting}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Análise
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 