"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@hooks/useAuth";
import AuthGuard from "@components/auth/AuthGuard";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  Youtube,
  ArrowLeft,
  Save,
  Loader,
  AlertTriangle,
  CheckCircle,
  Instagram,
  Linkedin,
  Globe,
  Tag,
  Users,
  Calendar,
  Hash,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
  categoryId?: string;
  listInVideos?: boolean;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

interface Category {
  _id: string;
  name: string;
  color?: string;
}

export default function EditChannelPage() {
  return (
    <AuthGuard>
      <EditChannelContent />
    </AuthGuard>
  );
}

function EditChannelContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Formulário
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    listInVideos: true,
    socialLinks: {
      instagram: "",
      linkedin: "",
      website: "",
    },
  });

  // Carregar dados do canal
  useEffect(() => {
    loadChannel();
    loadCategories();
  }, [channelId]);

  // Debug: monitorar mudanças no estado listInVideos
  useEffect(() => {
    console.log('Estado formData.listInVideos mudou para:', formData.listInVideos);
  }, [formData.listInVideos]);

  const loadChannel = async () => {
    try {
      const response = await fetch(`/api/channels/${channelId}`);
      if (!response.ok) {
        throw new Error("Canal não encontrado");
      }
      const data = await response.json();
      console.log('Dados do canal carregados:', data.channel);
      console.log('Valor listInVideos do banco:', data.channel.listInVideos);
      console.log('Tipo do valor listInVideos:', typeof data.channel.listInVideos);
      
      setChannel(data.channel);
      const listInVideosValue = data.channel.listInVideos === undefined ? true : data.channel.listInVideos;
      console.log('Valor final para o estado:', listInVideosValue);
      
      setFormData({
        title: data.channel.title || "",
        description: data.channel.description || "",
        categoryId: data.channel.categoryId || "",
        listInVideos: listInVideosValue,
        socialLinks: {
          instagram: data.channel.socialLinks?.instagram || "",
          linkedin: data.channel.socialLinks?.linkedin || "",
          website: data.channel.socialLinks?.website || "",
        },
      });
    } catch (error) {
      console.error("Erro ao carregar canal:", error);
      setError("Erro ao carregar dados do canal");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleListInVideos = async (newValue: boolean) => {
    try {
      console.log('=== DEBUG TOGGLE ===');
      console.log('Valor atual do formData.listInVideos:', formData.listInVideos);
      console.log('Novo valor solicitado:', newValue);
      
      const response = await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listInVideos: newValue
        }),
      });

      let data;
      try {
        data = await response.json();
        console.log('Resposta da atualização:', data);
      } catch (error) {
        console.error('Erro ao fazer parse da resposta:', error);
        throw new Error("Resposta inválida do servidor");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao atualizar listInVideos");
      }

      // Atualizar o estado local
      console.log('Atualizando estado local de', formData.listInVideos, 'para', newValue);
      setFormData(prev => {
        console.log('Estado anterior:', prev.listInVideos);
        const newState = {
          ...prev,
          listInVideos: newValue
        };
        console.log('Novo estado:', newState.listInVideos);
        return newState;
      });

      toast.success(`Canal ${newValue ? 'ativado' : 'desativado'} na lista de vídeos`);
    } catch (error) {
      console.error("Erro ao atualizar listInVideos:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const saveChannel = async () => {
    if (!channel) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          listInVideos: formData.listInVideos,
          socialLinks: formData.socialLinks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar canal");
      }

      toast.success("Canal atualizado com sucesso!");
      router.push("/channels");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setError(error instanceof Error ? error.message : "Erro ao atualizar canal");
    } finally {
      setSaving(false);
    }
  };

  const deleteChannel = async () => {
    if (!channel || !confirm("Tem certeza que deseja excluir este canal?")) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir canal");
      }

      toast.success("Canal excluído com sucesso!");
      router.push("/channels");
    } catch (error) {
      console.error("Erro ao excluir:", error);
      setError(error instanceof Error ? error.message : "Erro ao excluir canal");
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: string) => {
    const n = parseInt(num);
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return n.toString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-gray-600">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Carregando canal...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!channel) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Canal não encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              O canal que você está procurando não existe ou foi removido.
            </p>
            <button
              onClick={() => router.push("/channels")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Canais
            </button>
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
                  onClick={() => router.push("/channels")}
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
                    <h1 className="text-xl font-bold text-gray-900">
                      Atualizar Canal
                    </h1>
                    <p className="text-sm text-gray-500">
                      Edite as informações do canal
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={deleteChannel}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
                <button
                  onClick={saveChannel}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Informações do Canal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dados Básicos */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Youtube className="w-5 h-5 mr-2 text-red-600" />
                  Informações do Canal
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Canal
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Título do canal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Descrição do canal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange("categoryId", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center justify-between">
                      <span className="block text-sm font-medium text-gray-700">
                        Listar no Vídeos
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleListInVideos(!formData.listInVideos)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          formData.listInVideos ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.listInVideos ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      {formData.listInVideos 
                        ? "Este canal aparecerá na lista de vídeos" 
                        : "Este canal não aparecerá na lista de vídeos"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Redes Sociais */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  Redes Sociais
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Instagram className="w-4 h-4 mr-2 text-pink-600" />
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://instagram.com/usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://linkedin.com/in/usuario"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-green-600" />
                      Site Oficial
                    </label>
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) => handleSocialLinkChange("website", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar com Informações */}
            <div className="space-y-6">
              {/* Thumbnail e Info Básica */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    {channel.thumbnail ? (
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Youtube className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{channel.title}</h3>
                  <p className="text-sm text-gray-500">ID: {channel.youtubeChannelId}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Inscritos:
                    </span>
                    <span className="font-medium">
                      {channel.subscribers ? formatNumber(channel.subscribers) : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Hash className="w-4 h-4 mr-1" />
                      Vídeos:
                    </span>
                    <span className="font-medium">{channel.totalVideos || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Criado em:
                    </span>
                    <span className="font-medium">
                      {channel.publishedAt
                        ? new Date(channel.publishedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={`https://youtube.com/${channel.customUrl || channel.youtubeChannelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver no YouTube
                  </a>
                </div>
              </div>

              {/* Redes Sociais Ativas */}
              {(formData.socialLinks.instagram || formData.socialLinks.linkedin || formData.socialLinks.website) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Redes Sociais Ativas
                  </h3>
                  <div className="space-y-2">
                    {formData.socialLinks.instagram && (
                      <a
                        href={formData.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </a>
                    )}
                    {formData.socialLinks.linkedin && (
                      <a
                        href={formData.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-700 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </a>
                    )}
                    {formData.socialLinks.website && (
                      <a
                        href={formData.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-green-600 hover:text-green-700"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Site Oficial
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 