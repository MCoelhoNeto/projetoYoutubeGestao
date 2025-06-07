'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Video = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  duration?: string;
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

  const categorias = ['todas', ...dados.map((c) => c.categoriaNome)];
  const categoriasFiltradas =
    categoriaFiltro === 'todas'
      ? dados
      : dados.filter((c) => c.categoriaNome === categoriaFiltro);

  const analisar = (videoId: string) => {
    console.log('📊 Analisar vídeo:', videoId);
    // Aqui você pode fazer fetch para /api/analyze/{videoId}
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Vídeos por Categoria</h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
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

          <button
            onClick={() => setModoTexto(!modoTexto)}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            {modoTexto ? '🖼️ Modo imagem' : '📄 Modo texto'}
          </button>
        </div>

        {carregando && <p className="text-gray-500">⏳ Carregando vídeos...</p>}

        {!carregando &&
          categoriasFiltradas.map((categoria) => (
            <div
              key={categoria.categoriaNome}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <h2 className="text-xl font-semibold mb-3">
                📁 {categoria.categoriaNome}
              </h2>

              {categoria.canais.map((canal) => (
                <div key={canal.canalId} className="mb-6">
                  <h3 className="font-medium text-lg mb-2">🎥 {canal.canalNome}</h3>

                  {modoTexto ? (
                    <div className="space-y-4">
                      {canal.videos.map((video) => (
                        <div
                          key={video.videoId}
                          className="border rounded p-4 bg-gray-50"
                        >
                          <p className="font-semibold text-sm">{video.title}</p>
                          <p className="text-xs text-gray-500">
                            Publicado em:{' '}
                            {new Date(video.publishedAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Duração: {video.duration || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {video.description || 'Sem descrição.'}
                          </p>
                          <button
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            onClick={() => analisar(video.videoId)}
                          >
                            📊 Analisar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {canal.videos.map((video) => (
                        <div
                          key={video.videoId}
                          className="border rounded p-3 bg-gray-50 hover:shadow transition"
                        >
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full rounded mb-2"
                          />
                          <p className="font-semibold text-sm line-clamp-2">
                            {video.title}
                          </p>
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
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
