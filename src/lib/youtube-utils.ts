/**
 * Extrai o ID do vídeo do YouTube a partir de diferentes formatos de URL
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Padrões comuns de URLs do YouTube
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Se a string já parece ser um ID do YouTube (11 caracteres alfanuméricos)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Valida se uma string é um ID válido do YouTube
 */
export function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/**
 * Gera URL completa do YouTube a partir do ID
 */
export function getYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Gera URL de thumbnail do YouTube
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  const qualities = {
    default: 'default.jpg',
    medium: 'mqdefault.jpg',
    high: 'hqdefault.jpg',
    maxres: 'maxresdefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality]}`;
} 