export interface GameSearchResult {
  title: string;
  thumbnail: string;
  releaseYear?: number;
  developer?: string;
  publisher?: string;
  platforms?: string[];
  genres?: string[];
  averageHours?: number;
  synopsis?: string;
}

export async function searchGamesOnline(query: string): Promise<GameSearchResult[]> {
  try {
    const res = await fetch('/api/games/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error('Falha na resposta do servidor.');
    }

    const data = await res.json();
    return data.games || [];
  } catch (error) {
    console.warn('Erro ao consultar backend, usando fallback local:', error);
    // Return graceful search result if network or server error
    return [
      {
        title: query,
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        releaseYear: new Date().getFullYear(),
        developer: 'Estúdio',
        platforms: ['PlayStation 5', 'PC (Steam / Epic)', 'Nintendo Switch', 'Xbox Series X/S'],
        genres: ['Ação', 'Aventura'],
        averageHours: 20,
        synopsis: `Cadastro rápido de ${query}.`,
      },
    ];
  }
}

export async function fetchGameSynopsis(title: string): Promise<{
  synopsis: string;
  developer?: string;
  releaseYear?: number;
  genres?: string[];
}> {
  try {
    const res = await fetch('/api/games/synopsis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar endpoint de sinopse:', err);
  }

  return {
    synopsis: `${title} é uma jornada marcante com desafios empolgantes e narrativa envolvente.`,
  };
}
