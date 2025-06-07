'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
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

type Video = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
};

type Canal = {
  canalId: string;
  canalNome: string;
  videos: Video[];
};

type Categoria = {
  categoriaNome: string;
  canais: Canal[];
};

export default function VideosPage() {
  const [dados, setDados] = useState<Categoria[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [modoTexto, setModoTexto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const buscar = async () => {
      setCarregando(true);
      const res = await fetch('/api/videos', { credentials: 'include' });
      const data = await res.json();
      setDados(data);
      setCarregando(false);
    };

    buscar();
  }, []);

  const categorias = ['todas', ...dados.map((d) => d.categoriaNome)];

  const categoriasFiltradas =
    categoriaFiltro === 'todas'
      ? dados
      : dados.filter((c) => c.categoriaNome === categoriaFiltro);

  const analisar = (videoId: string) => {
    console.log('📊 Analisar vídeo:', videoId);
    // Aqui no futuro vai a chamada para /api/analyze
  };

  return (
    <>
    <div className=" bg-gray-50">
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
                    
                  </div>
                </div>
              </div>
            </div>
        </div>
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      {/* Filtros */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Select nativo */}
        <select
          className="border px-4 py-2 rounded"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Botão modo texto/imagem */}
        <button
          className="px-4 py-2 border rounded hover:bg-gray-100 transition"
          onClick={() => setModoTexto(!modoTexto)}
        >
          {modoTexto ? '🖼️ Modo imagem' : '📄 Modo texto'}
        </button>
      </div>

      {/* Carregando */}
      {carregando && <p className="text-gray-500">⏳ Carregando vídeos...</p>}

      {/* Lista de vídeos */}
      {!carregando &&
        categoriasFiltradas.map((categoria) => (
          <div
            key={categoria.categoriaNome}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <h2 className="text-xl font-semibold mb-3">{categoria.categoriaNome}</h2>

            {categoria.canais.map((canal) => (
              <div key={canal.canalId} className="mb-6">
                <h3 className="font-medium text-lg mb-2">{canal.canalNome}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canal.videos.map((video) => (
                    <div
                      key={video.videoId}
                      className="border rounded p-3 bg-gray-50 hover:shadow transition"
                    >
                      {!modoTexto && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full rounded mb-2"
                        />
                      )}
                      <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(video.publishedAt).toLocaleString()}
                      </p>
                      <button
                        className="mt-2 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                        onClick={() => analisar(video.videoId)}
                      >
                        📊 Analisar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
    </>
  );
}
