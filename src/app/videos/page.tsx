// /app/videos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@components/ui/button";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  RefreshCw,
  Grid3X3,
  List,
  Send,
  Play,
  CheckCircle,
  Clock,
  Filter,
  Youtube,
  Calendar,
  Eye,
  ExternalLink,
  Archive,
} from "lucide-react";

interface Video {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  status?: "pendente" | "analisado";
}

interface Canal {
  canalId: string;
  canalNome: string;
  videos: Video[];
  fromCache?: boolean;
  customUrl:string;
}

interface Categoria {
  categoriaNome: string;
  canais: Canal[];
}

const config = {
  interval: 10000,        // 10s entre verificações
  maxConcurrent: 3,       // 3 análises simultâneas
  enabled: true
}

export default function VideosPage() {
  const [dados, setDados] = useState<Categoria[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>(
    []
  );
  const [carregando, setCarregando] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todas");
  const [modoLista, setModoLista] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const router = useRouter();

  const buscarVideos = async () => {
    setCarregando(true);
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();

      if (!Array.isArray(json)) {
        toast.error(json?.error || "Erro ao buscar vídeos da API");
        return;
      }

      const dadosComStatus = json.map((categoria: Categoria) => ({
        ...categoria,
        canais: categoria.canais.map((canal) => ({
          ...canal,
          videos: canal.videos.map((v) => ({
            ...v,
            status: "pendente" as const,
          })),
        })),
      }));

      setDados(dadosComStatus);
      setCategoriasFiltradas(dadosComStatus);
      
      // Verificar análises existentes
      await verificarAnalisesExistentes(dadosComStatus);
    } catch (err) {
      toast.error("Erro inesperado ao carregar vídeos");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const verificarAnalisesExistentes = async (dadosVideos: Categoria[]) => {
    try {
      // Extrair todos os videoIds dos dados
      const todosVideoIds = dadosVideos.flatMap(cat =>
        cat.canais.flatMap(canal => canal.videos.map(v => v.videoId))
      );

      if (todosVideoIds.length === 0) return;

      // Usar a nova API eficiente para buscar apenas os videoIds analisados
      const res = await fetch(`/api/analyses/find-by-video?videoIds=${todosVideoIds.join(',')}`);
      if (res.ok) {
        const { videoIds } = await res.json();
        
        // Atualizar status dos vídeos que já foram analisados
        setDados((prev) => {
          const novosDados = prev.map((cat) => ({
            ...cat,
            canais: cat.canais.map((can) => ({
              ...can,
              videos: can.videos.map((v) => ({
                ...v,
                status: videoIds.includes(v.videoId) ? "analisado" as "analisado" : v.status,
              })),
            })),
          })) as Categoria[];
          
          // Atualizar também categoriasFiltradas
          setCategoriasFiltradas(novosDados);
          
          return novosDados;
        });
      } else {
        console.error('❌ Erro na API find-by-video:', res.status, res.statusText);
      }
    } catch (error) {
      console.error("Erro ao verificar análises existentes:", error);
    }
  };

  const atualizarCache = async () => {
    try {
      const res = await fetch("/api/videos/refresh", { method: "DELETE" });
      const json = await res.json();
      toast.success(json.message || "Cache limpo");
      await new Promise((r) => setTimeout(r, 500));
      await buscarVideos();
    } catch (err) {
      toast.error("Erro ao limpar cache");
    }
  };

  const aplicarFiltro = (nome: string) => {
    setCategoriaSelecionada(nome);
    if (nome === "todas") {
      setCategoriasFiltradas(dados);
    } else {
      setCategoriasFiltradas(dados.filter((c) => c.categoriaNome === nome));
    }
  };

  const enviarParaAnalise = async (video: Video, channelId?: string, categoryId?: string) => {
    try {
      // Encontrar o canal e categoria do vídeo
      let foundChannelId = channelId;
      let foundCategoryId = categoryId;
      
      if (!foundChannelId || !foundCategoryId) {
        for (const categoria of dados) {
          for (const canal of categoria.canais) {
            if (canal.videos.some(v => v.videoId === video.videoId)) {
              foundChannelId = canal.canalId;
              foundCategoryId = categoria.categoriaNome; // Usar o nome da categoria
              break;
            }
          }
          if (foundChannelId && foundCategoryId) break;
        }
      }

      if (!foundChannelId || !foundCategoryId) {
        toast.error("Não foi possível identificar o canal ou categoria do vídeo");
        return;
      }

      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.videoId,
          videoTitle: video.title,
          channelId: foundChannelId,
          categoryId: foundCategoryId
        }),
      });
      
      const json = await res.json();
      
      if (res.ok) {
        toast.success(`Análise iniciada: ${video.title}`);
        // Atualizar o status do vídeo para "analisado" imediatamente
        setDados((prev) => {
          const novosDados = prev.map((cat) => ({
            ...cat,
            canais: cat.canais.map((can) => ({
              ...can,
              videos: can.videos.map((v) =>
                v.videoId === video.videoId ? { ...v, status: "analisado" as "analisado" } : v
              ),
            })),
          })) as Categoria[];
          
          // Atualizar também categoriasFiltradas
          setCategoriasFiltradas(novosDados);
          
          return novosDados;
        });
      } else {
        if (res.status === 409) {
          // Análise já existe - mostrar toast informativo
          toast.info(`Análise já existe para: ${video.title}`, {
            action: {
              label: "Ver Análise",
              onClick: () => {
                // Navegar para a página de análises com filtro para este vídeo
                router.push(`/analyses?videoId=${video.videoId}`);
              }
            }
          });
          
          // Atualizar o status do vídeo para "analisado"
          setDados((prev) => {
            const novosDados = prev.map((cat) => ({
              ...cat,
              canais: cat.canais.map((can) => ({
                ...can,
                videos: can.videos.map((v) =>
                  v.videoId === video.videoId ? { ...v, status: "analisado" as "analisado" } : v
                ),
              })),
            })) as Categoria[];
            
            // Atualizar também categoriasFiltradas
            setCategoriasFiltradas(novosDados);
            
            return novosDados;
          });
        } else {
          toast.error(json.error || "Erro ao iniciar análise");
        }
      }
    } catch (error) {
      console.error("Erro ao enviar para análise:", error);
      toast.error("Erro ao iniciar análise");
    }
  };

  const enviarSelecionados = async () => {
    const videosComContexto = dados.flatMap((cat) =>
      cat.canais.flatMap((can) =>
        can.videos
          .filter((v) => selecionados.includes(v.videoId))
          .map((v) => ({
            video: v,
            channelId: can.canalId,
            categoryId: cat.categoriaNome
          }))
      )
    );

    for (const { video, channelId, categoryId } of videosComContexto) {
      await enviarParaAnalise(video, channelId, categoryId);
    }
    setSelecionados([]);
  };

  const toggleSelecionado = (videoId: string) => {
    setSelecionados((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((v) => v !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  useEffect(() => {
    buscarVideos();
  }, []);

  const categoriasUnicas = ["todas", ...dados.map((c) => c.categoriaNome)];
  const totalVideos = dados.reduce(
    (acc, cat) =>
      acc + cat.canais.reduce((acc2, canal) => acc2 + canal.videos.length, 0),
    0
  );
  const videosAnalisados = dados.reduce(
    (acc, cat) =>
      acc +
      cat.canais.reduce(
        (acc2, canal) =>
          acc2 + canal.videos.filter((v) => v.status === "analisado").length,
        0
      ),
    0
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
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
                      Últimos Vídeos
                    </h1>
                    <p className="text-sm text-gray-500">
                      {totalVideos} vídeos • {videosAnalisados} analisados
                    </p>
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
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={categoriaSelecionada}
                    onChange={(e) => aplicarFiltro(e.target.value)}
                  >
                    {categoriasUnicas.map((nome) => (
                      <option key={nome} value={nome}>
                        {nome === "todas" ? "Todas as categorias" : nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setModoLista(false)}
                    className={`p-2 rounded-l-lg transition-colors ${
                      !modoLista
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModoLista(true)}
                    className={`p-2 rounded-r-lg transition-colors ${
                      modoLista
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={enviarSelecionados}
                  disabled={selecionados.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Analisar Selecionados ({selecionados.length})
                </button>

                <button
                  onClick={atualizarCache}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Cache
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {carregando && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3 text-gray-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Carregando vídeos...</span>
              </div>
            </div>
          )}

          {!carregando && categoriasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum vídeo encontrado
              </h3>
              <p className="text-gray-500">
                Tente selecionar uma categoria diferente ou atualize o cache.
              </p>
            </div>
          )}

          {!carregando &&
            categoriasFiltradas.map((categoria) => (
              <div key={categoria.categoriaNome} className="mb-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {categoria.categoriaNome}
                  </h2>
                  <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
                </div>

                {categoria.canais.map((canal) => (
                  <div key={canal.canalId} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <Youtube className="w-5 h-5 text-white" />
                        </div>
                        <div>
                           <a
                              href={`https://www.youtube.com/${canal.customUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >

                          <h3 className="font-medium text-gray-900">
                            {canal.canalNome}
                          </h3>
                            </a>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{canal.videos.length} vídeos</span>
                            {canal.fromCache && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Cache
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${
                        modoLista
                          ? "space-y-3"
                          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      }`}
                    >
                      {canal.videos.map((video) => (
                        <div
                          key={video.videoId}
                          className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 ${
                            selecionados.includes(video.videoId)
                              ? "ring-2 ring-blue-500 ring-opacity-50"
                              : ""
                          } ${
                            modoLista ? "flex items-center p-4" : "group p-4"
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={selecionados.includes(video.videoId)}
                                onChange={() =>
                                  toggleSelecionado(video.videoId)
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>

                            {modoLista ? (
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      {video.status === "analisado" ? (
                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                      )}
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {video.title}
                                      </h4>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <div className="flex items-center space-x-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          {new Date(
                                            video.publishedAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          video.status === "analisado"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-orange-100 text-orange-800"
                                        }`}
                                      >
                                        {video.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    {video.status === "pendente" && (
                                      <button
                                        onClick={() => enviarParaAnalise(video, canal.canalId, categoria.categoriaNome)}
                                        className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors whitespace-nowrap"
                                      >
                                        <Send className="w-3 h-3 mr-1" />
                                        Analisar
                                      </button>
                                    )}
                                    {video.status === "analisado" && (
                                      <button
                                        onClick={() => router.push(`/analyses?videoId=${video.videoId}`)}
                                        className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver Análise
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `https://www.youtube.com/watch?v=${video.videoId}`,
                                          "_blank"
                                        )
                                      }
                                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      Ver
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <a
                                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <div className="relative mb-3">
                                    <div className="relative overflow-hidden rounded-lg bg-gray-200">
                                      <img
                                        src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-32 object-cover group-hover:opacity-90 transition-opacity rounded"
                                        loading="lazy"
                                      />
                                     
                                      <div className="absolute top-2 right-2">
                                        {video.status === "analisado" ? (
                                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Clock className="w-4 h-4 text-white" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <h4
                                    className="text-sm font-medium text-gray-900 mb-2 leading-tight"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {video.title}
                                  </h4>
                                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(
                                        video.publishedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </a>

                                <div className="flex items-center justify-between pt-2 gap-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                      video.status === "analisado"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {video.status}
                                  </span>

                                  <div className="flex items-center space-x-2">
                                    {video.status === "pendente" && (
                                      <button
                                        onClick={() => enviarParaAnalise(video, canal.canalId, categoria.categoriaNome)}
                                        className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors whitespace-nowrap flex-shrink-0"
                                      >
                                        <Send className="w-3 h-3 mr-1" />
                                        Analisar
                                      </button>
                                    )}
                                    {video.status === "analisado" && (
                                      <button
                                        onClick={() => router.push(`/analyses?videoId=${video.videoId}`)}
                                        className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap flex-shrink-0"
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver Análise
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
