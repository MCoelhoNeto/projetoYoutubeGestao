// /app/videos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@components/ui/button';
import DashboardLayout from '@components/layouts/DashboardLayout';

interface Video {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  status?: 'pendente' | 'analisado';
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
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [modoLista, setModoLista] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const router = useRouter();

  const buscarVideos = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/videos');
      const json = await res.json();

      if (!Array.isArray(json)) {
        toast.error(json?.error || 'Erro ao buscar vídeos da API');
        return;
      }

      const dadosComStatus = json.map((categoria: Categoria) => ({
        ...categoria,
        canais: categoria.canais.map((canal) => ({
          ...canal,
          videos: canal.videos.map((v) => ({
            ...v,
            status: 'pendente',
          }))
        }))
      }));

      setDados(dadosComStatus);
      setCategoriasFiltradas(dadosComStatus);
    } catch (err) {
      toast.error('Erro inesperado ao carregar vídeos');
      console.error(err);
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
    }
  };

  const aplicarFiltro = (nome: string) => {
    setCategoriaSelecionada(nome);
    if (nome === 'todas') {
      setCategoriasFiltradas(dados);
    } else {
      setCategoriasFiltradas(dados.filter(c => c.categoriaNome === nome));
    }
  };

  const enviarParaAnalise = async (video: Video) => {
    const res = await fetch('/api/analises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    });
    const json = await res.json();
    toast.success(`Vídeo enviado: ${video.title}`);
    setDados(prev => prev.map(cat => ({
      ...cat,
      canais: cat.canais.map(can => ({
        ...can,
        videos: can.videos.map(v => v.videoId === video.videoId ? { ...v, status: 'analisado' } : v)
      }))
    })));
  };

  const enviarSelecionados = async () => {
    const todos = dados.flatMap(cat =>
      cat.canais.flatMap(can =>
        can.videos.filter(v => selecionados.includes(v.videoId))
      )
    );

    for (const video of todos) {
      await enviarParaAnalise(video);
    }
    setSelecionados([]);
  };

  const toggleSelecionado = (videoId: string) => {
    setSelecionados((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter(v => v !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  useEffect(() => {
    buscarVideos();
  }, []);

  const categoriasUnicas = ['todas', ...dados.map(c => c.categoriaNome)];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold">Últimos Vídeos</h1>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              className="border rounded px-3 py-1 text-sm"
              value={categoriaSelecionada}
              onChange={(e) => aplicarFiltro(e.target.value)}
            >
              {categoriasUnicas.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => setModoLista(!modoLista)}>
              {modoLista ? '🔳 Modo Grade' : '📄 Modo Lista'}
            </Button>
            <Button variant="outline" onClick={enviarSelecionados} disabled={selecionados.length === 0}>
              📤 Analisar Selecionados ({selecionados.length})
            </Button>
            <Button onClick={atualizarCache}>🔄 Atualizar Cache</Button>
          </div>
        </div>

        {carregando && <p>Carregando vídeos...</p>}

        {!carregando && categoriasFiltradas.length === 0 && (
          <p className="text-gray-500">Nenhum vídeo encontrado.</p>
        )}

        {categoriasFiltradas.map((categoria) => (
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
                <div className={`${modoLista ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'}`}>
                  {canal.videos.map((video) => (
                    <div
                      key={video.videoId}
                      className={`border rounded px-4 py-2 bg-white ${modoLista ? 'flex items-center justify-between text-sm' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selecionados.includes(video.videoId)}
                          onChange={() => toggleSelecionado(video.videoId)}
                        />
                        {modoLista ? (
                          <div>
                            <p className="font-medium">
                              {video.status === 'analisado' ? '🟢' : '🟠'} {video.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(video.publishedAt).toLocaleString()} — Status: <span className={video.status === 'analisado' ? 'text-green-600' : 'text-orange-600'}>{video.status}</span>
                            </p>
                          </div>
                        ) : (
                          <a
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:shadow transition-all"
                          >
                            <img src={video.thumbnail} alt={video.title} className="mb-2 rounded" />
                            <p className="text-sm font-medium">{video.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(video.publishedAt).toLocaleString()}
                            </p>
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 md:mt-0 md:ml-4">
                        {video.status === 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => enviarParaAnalise(video)}
                          >
                            Inserir p/ análise
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                        >
                          Ver vídeo
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
