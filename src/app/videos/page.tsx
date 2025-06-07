// src/app/videos/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Loader, Sparkles } from 'lucide-react';

interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  url: string;
  aiAnalysis?: {
    analyzed: boolean;
    summary?: string;
    analyzedAt?: string;
  };
  category?: {
    _id: string;
    name: string;
    color: string;
  };
}

export default function VideosPage() {
  return (
    <AuthGuard>
      <VideosContent />
    </AuthGuard>
  );
}

function VideosContent() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user-videos')
      .then(res => res.json())
      .then(data => setVideos(data.videos || []))
      .finally(() => setLoading(false));
  }, []);

  const analyzeVideo = async (videoId: string) => {
    setAnalyzingId(videoId);
    const res = await fetch('/api/videos/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });

    if (res.ok) {
      alert('✅ Análise concluída!');
      // Reload vídeos após análise
      const updated = await fetch('/api/user-videos').then(r => r.json());
      setVideos(updated.videos);
    } else {
      const err = await res.json();
      alert('Erro ao analisar: ' + err.error);
    }

    setAnalyzingId(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando vídeos...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vídeos por Categoria</h1>

      {videos.length === 0 && <p className="text-gray-500">Nenhum vídeo encontrado.</p>}

      {videos.map((video) => (
        <div key={video._id} className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={video.thumbnail} alt={video.title} className="w-32 h-20 object-cover rounded" />
            <div className="flex-1">
              <a href={video.url} target="_blank" className="text-lg font-semibold text-blue-600 hover:underline">
                {video.title}
              </a>
              {video.category && (
                <p className="text-sm text-gray-500 mt-1">
                  Categoria: <span className="font-medium" style={{ color: video.category.color }}>{video.category.name}</span>
                </p>
              )}
              {video.aiAnalysis?.analyzed && video.aiAnalysis?.summary ? (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                  <strong>Resumo:</strong> {video.aiAnalysis.summary}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-2">Este vídeo ainda não foi analisado.</p>
              )}
            </div>
            <div className="w-48 text-right">
              <Button
                onClick={() => analyzeVideo(video._id)}
                disabled={analyzingId === video._id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {analyzingId === video._id ? (
                  <span className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin" /> Analisando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} /> Analisar Conteúdo
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
