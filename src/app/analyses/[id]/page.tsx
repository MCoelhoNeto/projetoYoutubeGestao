"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Brain,
  FileText,
  Calendar,
  ExternalLink,
  Tag,
  Loader,
  RefreshCw,
  Mail,
  Save,
  Edit3,
} from "lucide-react";

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
  notes?: string;
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

export default function AnalysisDetailPage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullTranscription, setShowFullTranscription] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;

  const fetchAnalysis = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (fetching) return;
    
    setFetching(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Análise não encontrada");
          router.push("/analyses");
          return;
        }
        throw new Error("Erro ao buscar análise");
      }
      
      const data = await res.json();
      setAnalysis(data.analysis);
      setNotes(data.analysis.notes || "");
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar análise");
      router.push("/analyses");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  const refazerAnalise = async () => {
    if (!analysis) return;
    
    setRefreshing(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao refazer análise");
      }

      const data = await res.json();
      toast.success(data.message || "Análise resetada para reprocessamento");
      
      // Atualizar o status localmente imediatamente
      setAnalysis(prev => prev ? {
        ...prev,
        status: "processing" as "processing",
        transcription: "",
        aiSummary: "",
        errorMessage: ""
      } : null);

      // Forçar uma atualização após 2 segundos para verificar o status
      setTimeout(() => {
        fetchAnalysis();
      }, 2000);

    } catch (error: any) {
      toast.error(error.message || "Erro ao refazer análise");
    } finally {
      setRefreshing(false);
    }
  };

  const sendEmail = async () => {
    if (!emailAddress || !analysis) return;
    
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailAddress })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao enviar email");
      }

      const data = await res.json();
      toast.success(data.message || "Email enviado com sucesso");
      setShowEmailModal(false);
      setEmailAddress("");

    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setSendingEmail(false);
    }
  };

  const saveNotes = async () => {
    if (!analysis) return;
    
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar anotações");
      }

      toast.success("Anotações salvas com sucesso");
      setIsEditingNotes(false);
      
      // Atualizar o analysis local
      setAnalysis(prev => prev ? { ...prev, notes } : null);

    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar anotações");
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  // Auto-refresh quando estiver processando
  useEffect(() => {
    if (analysis?.status === "processing") {
      const interval = setInterval(() => {
        // Só fazer fetch se não estiver já carregando ou fazendo fetch
        if (!loading && !fetching) {
          fetchAnalysis();
        }
      }, 5000); // Atualizar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [analysis?.status, loading, fetching]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-3 text-gray-600">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Carregando análise...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analysis) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Análise não encontrada
            </h3>
            <button
              onClick={() => router.push("/analyses")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Análises
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusInfo = getStatusInfo(analysis.status);

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
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Detalhes da Análise
                    </h1>
                    <p className="text-sm text-gray-500">
                      {analysis.videoTitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchAnalysis}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </button>
                
                <a
                  href={`https://www.youtube.com/watch?v=${analysis.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {analysis.videoTitle}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
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

                {/* Video Frame */}
                <div className="relative overflow-hidden rounded-lg bg-gray-200 mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${analysis.videoId}`}
                    title={analysis.videoTitle}
                    className="w-full h-96"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
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

              {/* AI Analysis */}
              {analysis.status === "completed" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Análise da IA
                    </h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 whitespace-pre-line">
                      {analysis.aiSummary}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {analysis.status === "processing" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Processando Análise
                    </h3>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>A análise está sendo processada pelo worker. Isso pode levar alguns minutos.</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Dica:</strong> Você pode atualizar a página ou clicar em "Atualizar" para ver o progresso.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {analysis.status === "error" && analysis.errorMessage && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Erro na Análise
                    </h3>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800">
                      {analysis.errorMessage}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      🔄 <strong>Solução:</strong> Tente refazer a análise usando o botão "Refazer Análise" no topo da página.
                    </p>
                  </div>
                </div>
              )}

              {/* Transcription */}
              {analysis.status === "completed" && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Transcrição Completa
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowFullTranscription(!showFullTranscription)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showFullTranscription ? "Mostrar Menos" : "Mostrar Mais"}
                    </button>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div
                      className={`text-gray-700 whitespace-pre-line ${
                        showFullTranscription ? "" : "max-h-96 overflow-hidden"
                      }`}
                    >
                      {analysis.transcription}
                    </div>
                    {!showFullTranscription && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowFullTranscription(true)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mostrar transcrição completa...
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Editor */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Edit3 className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Anotações Extras
                    </h3>
                  </div>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      <Edit3 className="w-4 h-4 mr-1 inline" />
                      Editar
                    </button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <div className="space-y-4">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione suas anotações, observações ou comentários sobre este vídeo..."
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      disabled={savingNotes}
                    />
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => {
                          setIsEditingNotes(false);
                          setNotes(analysis.notes || "");
                        }}
                        disabled={savingNotes}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingNotes ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 whitespace-pre-line min-h-[2rem]">
                      {notes || (
                        <span className="text-gray-400 italic">
                          Nenhuma anotação adicionada. Clique em "Editar" para adicionar suas observações.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Status da Análise
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center p-3 rounded-lg ${statusInfo.bg}`}>
                    <statusInfo.icon className={`w-5 h-5 ${statusInfo.color} mr-3`} />
                    <span className={`font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    {(analysis.status === "completed" || analysis.status === "error") && (
                      <button
                        onClick={refazerAnalise}
                        disabled={refreshing}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {refreshing ? (
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        {refreshing ? "Refazendo..." : "Refazer Análise"}
                      </button>
                    )}
                    
                    {analysis.status === "completed" && (
                      <button
                        onClick={() => setShowEmailModal(true)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar por Email
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Detalhes do Vídeo
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">ID do Vídeo:</span>
                    <p className="text-sm text-gray-900 font-mono">{analysis.videoId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Canal:</span>
                    <p className="text-sm text-gray-900">{analysis.channelName}</p>
                  </div>
                  {analysis.categoryId && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Categoria:</span>
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2"
                        style={{
                          backgroundColor: `${analysis.categoryId.color}20`,
                          color: analysis.categoryId.color,
                        }}
                      >
                        {analysis.categoryId.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Enviar por Email
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Digite o endereço de email para onde deseja enviar a análise:
              </p>
              
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={sendingEmail}
              />
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress("");
                  }}
                  disabled={sendingEmail}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendEmail}
                  disabled={!emailAddress || sendingEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 