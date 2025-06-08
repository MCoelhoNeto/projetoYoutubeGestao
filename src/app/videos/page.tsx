// /app/videos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import  Button  from '@components/ui/button';

interface Video {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

interface Canal {
  canalId: string;
  canalNome: string;
  videos: Video[];
  fromCache?: boolean;
}

interface Categoria {
  categoriaNome: string;
  canais: Canal[];
}

export default function VideosPage() {
  const [dados, setDados] = useState<Categoria[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  const buscarVideos = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/videos');
      let json;
      try {
        json = await res.json();
      } catch (err) {
        toast.error('Erro ao decodificar JSON da resposta');
        console.error('❌ Erro ao fazer parse do JSON:', err);
        return;
      }

      if (!json || typeof json !== 'object' || !Array.isArray(json)) {
        const erro = json?.error || 'Erro ao buscar vídeos da API';
        toast.error(erro);

        const conteudo = Object.keys(json || {}).length > 0
          ? JSON.stringify(json, null, 2)
          : 'Resposta da API está vazia ou malformada.';

        toast.message('Resposta da API:', {
          description: (
            <pre className="text-xs max-h-60 overflow-auto">{conteudo}</pre>
          ),
          duration: 10000
        });

       // console.error('❌ Resposta inválida da API:', JSON.stringify(json));
        return;
      }

      setDados(json);
      setCategoriasFiltradas(json);
    } catch (err) {
      toast.error('Erro inesperado ao carregar vídeos');
      console.error('Erro ao buscar vídeos:', err);
    } finally {
      setCarregando(false);
    }
  };

  const atualizarCache = async () => {
    try {
      const res = await fetch('/api/videos/refresh', { method: 'DELETE' });
      const json = await res.json();
      toast.success(json.message || 'Cache limpo');
      await new Promise((r) => setTimeout(r, 500));
      await buscarVideos();
    } catch (err) {
      toast.error('Erro ao limpar cache');
      console.error('Erro no atualizarCache:', err);
    }
  };

  useEffect(() => {
    buscarVideos();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Últimos Vídeos</h1>
        </div>
        <Button onClick={atualizarCache}>🔄 Atualizar Cache</Button>
      </div>

      {carregando && <p>Carregando vídeos...</p>}

      {!carregando && Array.isArray(categoriasFiltradas) && categoriasFiltradas.length === 0 && (
        <p className="text-gray-500">Nenhum vídeo encontrado.</p>
      )}

      {!carregando && Array.isArray(categoriasFiltradas) && categoriasFiltradas.map((categoria) => (
        <div key={categoria.categoriaNome}>
          <h2 className="text-xl font-semibold mt-6 mb-2">{categoria.categoriaNome}</h2>
          {categoria.canais.map((canal) => (
            <div key={canal.canalId} className="mb-4">
              <h3 className="font-medium text-gray-700 mb-1">
                {canal.canalNome}
                {canal.fromCache && (
                  <span className="ml-2 text-xs text-green-600">(cache)</span>
                )}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {canal.videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded p-3 hover:shadow transition-all bg-white"
                  >
                    <img src={video.thumbnail} alt={video.title} className="mb-2 rounded" />
                    <p className="text-sm font-medium">{video.title}</p>
                    <p className="text-xs text-gray-500">{new Date(video.publishedAt).toLocaleString()}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
