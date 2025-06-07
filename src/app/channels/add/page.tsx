"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@hooks/useAuth";
import AuthGuard from "@components/auth/AuthGuard";
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
} from "lucide-react";

interface ChannelData {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  publishedAt: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
}

export default function AddChannelPage() {
  return (
    <AuthGuard>
      <AddChannelContent />
    </AuthGuard>
  );
}

function AddChannelContent() {
  const { user, canAddChannel, getRemainingChannels } = useAuth();
  const router = useRouter();

  // Estados
  const [step, setStep] = useState<"search" | "details" | "success">("search");
  const [searchType, setSearchType] = useState<"url" | "name">("url");
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearcing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dados do canal
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Categorias
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  // Verificar limite do plano
  useEffect(() => {
    if (!canAddChannel()) {
      setError(
        `Limite de canais atingido (${
          user?.plan?.features?.maxChannels ?? "N/A"
        }}). Faça upgrade para adicionar mais canais.`
      );
    }
  }, [user, canAddChannel]);

  // Carregar categorias
  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

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

  const searchChannel = async () => {
    if (!searchValue.trim()) {
      setError("Digite uma URL ou nome do canal");
      return;
    }

    setSearcing(true);
    setError("");

    try {
      const response = await fetch("/api/youtube/search-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchValue,
          type: searchType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar canal");
      }

      setChannelData(data.channel);
      setStep("details");
    } catch (error) {
      console.error("Erro na busca:", error);
      setError(error instanceof Error ? error.message : "Erro ao buscar canal");
    } finally {
      setSearcing(false);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Digite um nome para a categoria");
      return;
    }

    setIsCreatingCategory(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName,
          description: `Categoria criada durante cadastro do canal`,
          color: "#3B82F6",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar categoria");
      }

      // Adicionar nova categoria à lista
      setCategories((prev) => [...prev, data.category]);
      setSelectedCategory(data.category._id);
      setNewCategoryName("");
      setShowCreateCategory(false);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao criar categoria"
      );
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const saveChannel = async () => {
    if (!channelData) return;
    if (!selectedCategory) {
      setError("Selecione uma categoria para o canal");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeChannelId: channelData.id,
          title: channelData.title,
          description: channelData.description,
          customUrl: channelData.customUrl,
          thumbnails: channelData.thumbnails,
          statistics: channelData.statistics,
          publishedAt: channelData.publishedAt,
          categoryId: selectedCategory,
        }),
          credentials: "include" 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar canal");
      }

      setStep("success");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setError(error instanceof Error ? error.message : "Erro ao salvar canal");
    } finally {
      setSaving(false);
    }
  };

  const extractChannelIdFromUrl = (url: string) => {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toString();
  };

  // Se não pode adicionar canais
  if (!canAddChannel()) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg border p-8 text-center">
            <AlertTriangle className="mx-auto text-orange-500 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Limite de Canais Atingido
            </h1>
            <p className="text-gray-600 mb-6">
              Seu plano atual permite até{" "}
              {user?.plan?.features?.maxChannels ?? "N/A"} canais. Você já tem{" "}
              {user?.usage?.channelsCount ?? "N/A"} canais cadastrados.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/upgrade")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fazer Upgrade
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Adicionar Canal
              </h1>
              <p className="text-gray-600">
                Restam {getRemainingChannels()} canais no seu plano
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {/* Step 1 */}
            <div
              className={`flex items-center ${
                step === "search" ? "text-blue-600" : "text-green-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "search" ? "bg-blue-100" : "bg-green-100"
                }`}
              >
                {step === "search" ? "1" : <CheckCircle size={20} />}
              </div>
              <span className="ml-2 font-medium">Buscar Canal</span>
            </div>

            <div
              className={`flex-1 h-1 mx-4 ${
                step !== "search" ? "bg-green-200" : "bg-gray-200"
              }`}
            />

            {/* Step 2 */}
            <div
              className={`flex items-center ${
                step === "details"
                  ? "text-blue-600"
                  : step === "success"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "details"
                    ? "bg-blue-100"
                    : step === "success"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                {step === "success" ? <CheckCircle size={20} /> : "2"}
              </div>
              <span className="ml-2 font-medium">Configurar</span>
            </div>

            <div
              className={`flex-1 h-1 mx-4 ${
                step === "success" ? "bg-green-200" : "bg-gray-200"
              }`}
            />

            {/* Step 3 */}
            <div
              className={`flex items-center ${
                step === "success" ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "success" ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {step === "success" ? <CheckCircle size={20} /> : "3"}
              </div>
              <span className="ml-2 font-medium">Concluído</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={16}
              />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Search */}
        {step === "search" && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Encontre o Canal do YouTube
            </h2>

            {/* Search Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Como você quer buscar o canal?
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSearchType("url")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    searchType === "url"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="text-blue-600" size={20} />
                    <div>
                      <div className="font-medium">URL do Canal</div>
                      <div className="text-sm text-gray-500">
                        Cole o link direto do canal
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSearchType("name")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    searchType === "name"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Search className="text-blue-600" size={20} />
                    <div>
                      <div className="font-medium">Nome do Canal</div>
                      <div className="text-sm text-gray-500">
                        Buscar pelo nome
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchType === "url" ? "URL do Canal" : "Nome do Canal"}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === "url"
                      ? "https://youtube.com/channel/UC..."
                      : "Digite o nome do canal"
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && searchChannel()}
                />
                <button
                  onClick={searchChannel}
                  disabled={searching || !searchValue.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searching ? (
                    <Loader className="animate-spin" size={20} />
                  ) : (
                    <Search size={20} />
                  )}
                  {searching ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {searchType === "url" && (
                <p className="mt-2 text-sm text-gray-500">
                  Formatos aceitos: youtube.com/channel/ID, youtube.com/c/nome,
                  youtube.com/@nome
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && channelData && (
          <div className="space-y-6">
            {/* Channel Preview */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações do Canal
              </h2>

              <div className="flex gap-6">
                <img
                  src={channelData.thumbnails.medium}
                  alt={channelData.title}
                  className="w-24 h-24 rounded-full"
                />

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {channelData.title}
                  </h3>

                  {channelData.customUrl && (
                    <p className="text-blue-600 mb-2">
                      youtube.com/{channelData.customUrl}
                    </p>
                  )}

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {channelData.description}
                  </p>

                  <div className="flex gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      {formatNumber(
                        channelData.statistics.subscriberCount
                      )}{" "}
                      inscritos
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash size={16} />
                      {formatNumber(channelData.statistics.videoCount)} vídeos
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(channelData.publishedAt).getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Escolha uma Categoria
              </h2>

              {/* Existing Categories */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorias Existentes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setSelectedCategory(category._id)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedCategory === category._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">
                              {category.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Category */}
              <div className="border-t pt-4">
                {!showCreateCategory ? (
                  <button
                    onClick={() => setShowCreateCategory(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <FolderPlus size={20} />
                    Criar Nova Categoria
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nome da nova categoria"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) =>
                          e.key === "Enter" && createCategory()
                        }
                      />
                      <button
                        onClick={createCategory}
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {isCreatingCategory ? "Criando..." : "Criar"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateCategory(false);
                          setNewCategoryName("");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep("search")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Voltar
              </button>
              <button
                onClick={saveChannel}
                disabled={saving || !selectedCategory}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Salvando Canal...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Adicionar Canal
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && channelData && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Canal Adicionado com Sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              O canal <strong>{channelData.title}</strong> foi adicionado à sua
              lista.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/channels")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ver Meus Canais
              </button>
              <button
                onClick={() => {
                  setStep("search");
                  setChannelData(null);
                  setSelectedCategory("");
                  setSearchValue("");
                  setError("");
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Adicionar Outro Canal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
