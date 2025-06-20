// /app/categories/[id]/edit/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Button from "@components/ui/button";
import { CategoryService } from "@lib/services/categoryService";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  Tag,
  FileText,
  Palette,
  Save,
  X,
  Loader,
  Info,
  Youtube,
  Users,
  MoreVertical,
  Trash2,
  Move,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  Archive,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

// ✅ Adicionado: constante de cores pré-definidas para evitar erro "predefinedColors is not defined"
const predefinedColors = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#EC4899",
  "#6B7280",
  "#059669",
  "#DC2626",
];

// Tipagens simplificadas para os dados de canais e categorias
interface Channel {
  _id: string;
  youtubeChannelId: string;
  title: string;
  subscribers?: string;
  videos?: number;
  cacheStatus?: string;
  analysisCount?: number;
  maxAnalysis?: number;
  customUrl?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  tags?: string;
  icon?: string;
  channels?: Channel[];
  createdAt?: string;
  updatedAt?: string;
  listInVideos?: boolean;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [tags, setTags] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [listInVideos, setListInVideos] = useState(true);

  // ✅ Adicionado: ícones de status de cache dos canais
  const getCacheStatusIcon = (status?: string) => {
    switch (status) {
      case "fresh":
        return <CheckCircle className="text-green-500" size={16} />;
      case "stale":
        return <Clock className="text-yellow-500" size={16} />;
      case "empty":
      default:
        return <AlertTriangle className="text-gray-400" size={16} />;
    }
  };

  // ✅ Carregamento inicial da categoria e canais relacionados
  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        const [categoryData, allCats] = await Promise.all([
          CategoryService.getById(categoryId),
          CategoryService.list(),
        ]);
        setCategory(categoryData);
        setName(categoryData.name);
        setDescription(categoryData.description || "");
        setColor(categoryData.color || "#3B82F6");
        setTags(categoryData.tags || "");
        setIcon(categoryData.icon || "");
        setListInVideos(categoryData.listInVideos === undefined ? true : categoryData.listInVideos);
        setChannels(categoryData.channels || []);
        setAllCategories(allCats.filter((c: Category) => c._id !== categoryId));
      } catch (err: any) {
        toast.error("Erro ao carregar categoria");
        router.push("/categories");
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [categoryId, router]);

  // Debug: monitorar mudanças no estado listInVideos
  useEffect(() => {
    console.log('Estado listInVideos da categoria mudou para:', listInVideos);
  }, [listInVideos]);

  // ✅ Atualizar categoria existente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nome obrigatório");
    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          color,
          tags,
          icon,
        }),
      });

      let data;
      try {
        data = await response.json();
        console.log('Resposta da atualização da categoria:', data);
      } catch (error) {
        console.error('Erro ao fazer parse da resposta:', error);
        throw new Error("Resposta inválida do servidor");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar categoria");
      }

      toast.success("Categoria atualizada");
      router.push("/categories");
    } catch (err: any) {
      toast.error("Erro ao atualizar categoria");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Nova funcionalidade: Remover canal via API
  const handleRemoveChannel = async (channelId: string) => {
    if (!confirm("Remover canal da categoria?")) return;
    try {
      const res = await fetch(`/api/channels/${channelId}/uncategorize`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      setChannels((prev) => prev.filter((ch) => ch._id !== channelId));
      toast.success("Canal removido");
    } catch {
      toast.error("Erro ao remover canal");
    }
  };

  // ✅ Nova funcionalidade: Transferir canal para outra categoria via API
  const handleTransferChannel = async () => {
    if (!selectedChannel || !targetCategoryId) return;
    try {
      const res = await fetch(`/api/channels/${selectedChannel._id}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCategoryId: targetCategoryId }),
      });
      if (!res.ok) throw new Error();
      setChannels((prev) =>
        prev.filter((ch) => ch._id !== selectedChannel._id)
      );
      setShowTransferModal(false);
      setSelectedChannel(null);
      setTargetCategoryId("");
      toast.success("Canal transferido");
    } catch {
      toast.error("Erro ao transferir canal");
    }
  };

  const handleCancel = () => {
    const hasChanges =
      name !== category?.name ||
      description !== (category?.description || "") ||
      color !== (category?.color || "#3B82F6");

    if (hasChanges) {
      if (confirm("Deseja descartar as alterações?")) {
        router.push("/categories");
      }
    } else {
      router.push("/categories");
    }
  };

  const handleToggleListInVideos = async (newValue: boolean) => {
    try {
      console.log('=== DEBUG TOGGLE CATEGORIA ===');
      console.log('Valor atual do listInVideos:', listInVideos);
      console.log('Novo valor solicitado:', newValue);
      
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listInVideos: newValue
        }),
      });

      let data;
      try {
        data = await response.json();
        console.log('Resposta da atualização da categoria:', data);
      } catch (error) {
        console.error('Erro ao fazer parse da resposta:', error);
        throw new Error("Resposta inválida do servidor");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar listInVideos");
      }

      // Atualizar o estado local
      console.log('Atualizando estado local da categoria de', listInVideos, 'para', newValue);
      setListInVideos(newValue);

      toast.success(`Categoria ${newValue ? 'ativada' : 'desativada'} na lista de vídeos`);
    } catch (error) {
      console.error("Erro ao atualizar listInVideos da categoria:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-gray-600">
            <Loader className="w-6 h-6 animate-spin" />
            <span>Carregando categoria...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!category) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Categoria não encontrada
            </h3>
            <p className="text-gray-500 mb-6">
              A categoria solicitada não existe ou foi removida.
            </p>
            <Button onClick={() => router.push("/categories")}>
              Voltar às Categorias
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                <div className="hidden sm:block w-px h-6 bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Tag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Editar Categoria
                    </h1>
                    <p className="text-sm text-gray-500">
                      Gerencie informações e canais da categoria
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-3 space-y-8">
              {/* Category Information */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informações da Categoria
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Atualize os dados básicos da categoria
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 mr-2" />
                      Nome da Categoria
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: Tech & Programação, Lifestyle, Gaming..."
                      required
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {name.length}/50 caracteres
                    </p>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 mr-2" />
                      Descrição
                      <span className="text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Descreva o tipo de conteúdo desta categoria..."
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/200 caracteres
                    </p>
                  </div>

                  {/* Color Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Palette className="w-4 h-4 mr-2" />
                      Cor da Categoria
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                      {predefinedColors.map((colorOption) => (
                        <button
                          key={colorOption}
                          type="button"
                          onClick={() => setColor(colorOption)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                            color === colorOption
                              ? "border-gray-800 ring-2 ring-gray-300"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: colorOption }}
                        >
                          {color === colorOption && (
                            <CheckCircle className="w-5 h-5 text-white mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center space-x-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">
                        Ou escolha uma cor personalizada
                      </span>
                    </div>
                  </div>

                  {/* List in Videos Toggle */}
                  <div>
                    <label className="flex items-center justify-between">
                      <span className="block text-sm font-medium text-gray-700">
                        Listar no Vídeos
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleListInVideos(!listInVideos)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          listInVideos ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            listInVideos ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      {listInVideos 
                        ? "Esta categoria aparecerá na lista de vídeos" 
                        : "Esta categoria não aparecerá na lista de vídeos"
                      }
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Channels Management */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Canais da Categoria
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Gerencie os canais associados a esta categoria
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Youtube className="w-4 h-4" />
                      <span>{channels.length} canais</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {channels.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        Nenhum canal nesta categoria
                      </h3>
                      <p className="text-xs text-gray-500">
                        Adicione canais através do dashboard principal
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {channels.map((channel) => (
                        <div
                          key={channel._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                              <Youtube className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {channel.title}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>{channel.subscribers || "N/A"}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getCacheStatusIcon(channel.cacheStatus)}
                                  <span>{channel.cacheStatus || "empty"}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>
                                    Análises: {channel.analysisCount || 0}/
                                    {channel.maxAnalysis || 10}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://www.youtube.com/${channel.customUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            <button
                              onClick={() => {
                                setSelectedChannel(channel);
                                setShowTransferModal(true);
                              }}
                              className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                              title="Transferir para outra categoria"
                            >
                              <Move className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveChannel(channel._id)}
                              className="p-2 text-red-400 hover:text-red-600 transition-colors"
                              title="Remover da categoria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Preview */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Pré-visualização
                  </h3>
                </div>
                <div className="p-4">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center text-white mb-3 transition-colors"
                      style={{ backgroundColor: color }}
                    >
                      <Tag className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {name || "Nome da Categoria"}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {description ||
                        "Descrição da categoria aparecerá aqui..."}
                    </p>
                    <div className="text-xs text-gray-400">
                      {channels.length} canais
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Info */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center text-sm font-semibold text-gray-900">
                    <Info className="w-4 h-4 mr-2" />
                    Informações
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Criada em:</span>
                    <span className="text-gray-900">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Última atualização:</span>
                    <span className="text-gray-900">
                      {category.updatedAt
                        ? new Date(category.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total de canais:</span>
                    <span className="text-gray-900">{channels.length}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-yellow-200">
                  <div className="flex items-center text-sm font-semibold text-yellow-900">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Ações Rápidas
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => router.push("/videos")}
                    className="w-full text-left px-3 py-2 text-xs text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    Ver vídeos dos canais
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full text-left px-3 py-2 text-xs text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    Adicionar mais canais
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && selectedChannel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transferir Canal
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Transferir {selectedChannel.title} para outra categoria
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria de destino
                  </label>
                  <select
                    value={targetCategoryId}
                    onChange={(e) => setTargetCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {allCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedChannel(null);
                    setTargetCategoryId("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransferChannel}
                  disabled={!targetCategoryId}
                  className="px-4 py-2 bg-blue-600 text-sm font-medium rounded-lg text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Transferir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
