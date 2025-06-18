"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@components/ui/button";
import DashboardLayout from "@components/layouts/DashboardLayout";

export default function TesteAnalisePage() {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testarAnalise = async () => {
    if (!videoId.trim()) {
      toast.error("Digite um ID de vídeo válido");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/analises/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: videoId.trim(),
          videoTitle: "Vídeo de Teste",
          channelId: "test-channel-id",
          categoryId: "test-category"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success("Análise realizada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao realizar análise");
        setResult({ error: data.error, details: data.details });
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão");
      setResult({ error: "Erro de conexão" });
    } finally {
      setLoading(false);
    }
  };

  const listarAnalises = async () => {
    try {
      const response = await fetch("/api/analyses/test");
      const data = await response.json();

      if (response.ok) {
        setResult({ analyses: data.analyses, total: data.total });
        toast.success(`Encontradas ${data.total} análises`);
      } else {
        toast.error(data.error || "Erro ao listar análises");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro de conexão");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Teste da API de Análise (Sem Autenticação)
            </h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Vídeo do YouTube
                </label>
                <input
                  type="text"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  placeholder="Ex: dQw4w9WgXcQ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Cole o ID do vídeo do YouTube (11 caracteres)
                </p>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={testarAnalise}
                  disabled={loading || !videoId.trim()}
                  className="flex-1"
                >
                  {loading ? "Analisando..." : "Testar Análise"}
                </Button>

                <Button
                  onClick={listarAnalises}
                  className="flex-1"
                >
                  Listar Análises
                </Button>
              </div>
            </div>

            {result && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Resultado:
                </h2>
                
                {result.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800 font-medium">Erro:</p>
                    <p className="text-red-700">{result.error}</p>
                    {result.details && (
                      <p className="text-red-600 text-sm mt-2">Detalhes: {result.details}</p>
                    )}
                  </div>
                ) : result.analyses ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-blue-800 font-medium mb-2">
                      Análises Encontradas ({result.total}):
                    </p>
                    <div className="space-y-2">
                      {result.analyses.map((analysis: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <p className="font-medium">{analysis.videoTitle}</p>
                          <p className="text-sm text-gray-600">ID: {analysis.videoId}</p>
                          <p className="text-sm text-gray-600">Status: {analysis.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800 font-medium mb-2">
                      Análise Concluída:
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Resumo:</h3>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {result.analysis?.summary?.map((item: string, index: number) => (
                            <li key={index} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">Opinião:</h3>
                        <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                          {result.analysis?.opinion}
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>Status: {result.analysis?.status}</p>
                        <p>ID da Análise: {result.analysis?.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 