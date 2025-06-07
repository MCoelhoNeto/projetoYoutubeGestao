'use client';

import { useEffect, useState } from 'react';

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
  const [carregando, setCarregando] = useState(false);

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

  const categorias = ['todas', ...dados.map(d => d.categoriaNome)];

  const categoriasFiltradas = categoriaFiltro === 'todas'
    ? dados
    : dados.filter(c => c.categoriaNome === categoriaFiltro);

  const analisar = (videoId: string) => {
    console.log('📊 Analisar vídeo:', videoId);
    // aqui você chamará a /api/analyze futuramente
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📺 Vídeos por categoria</h1>

      {/* Filtro de categorias */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categorias.map(cat => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full border ${
              categoriaFiltro === cat ? 'bg-blue-600 text-white' : 'bg-white text-black'
            }`}
            onClick={() => setCategoriaFiltro(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Lista de vídeos */}
      {carregando && <p>⏳ Carregando vídeos...</p>}

      {!carregando && categoriasFiltradas.map((categoria) => (
        <div key={categoria.categoriaNome} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{categoria.categoriaNome}</h2>

          {categoria.canais.map(canal => (
            <div key={canal.canalId} className="mb-4">
              <h3 className="font-medium text-lg mb-2">{canal.canalNome}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {canal.videos.map(video => (
                  <div key={video.videoId} className="border p-3 rounded shadow">
                    <img src={video.thumbnail} alt={video.title} className="w-full mb-2 rounded" />
                    <p className="font-semibold text-sm">{video.title}</p>
                    <p className="text-xs text-gray-500">{new Date(video.publishedAt).toLocaleString()}</p>
                    <button
                      className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
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
  );
}
