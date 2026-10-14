import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback high-quality cover database for popular games
const POPULAR_GAMES_FALLBACK = [
  {
    title: 'Elden Ring',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp',
    releaseYear: 2022,
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    platforms: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'PC'],
    genres: ['RPG de Ação', 'Souls-like', 'Mundo Aberto'],
    averageHours: 58,
    synopsis: 'Nas Terras Intermédias governadas pela Rainha Marika, o Anel Prístino foi destruído. Torne-se um Maculado para reivindicar o poder do Anel e tornar-se o Lorde Prístino.',
  },
  {
    title: 'The Witcher 3: Wild Hunt',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.webp',
    releaseYear: 2015,
    developer: 'CD Projekt RED',
    publisher: 'CD Projekt',
    platforms: ['PC', 'PlayStation 4', 'PlayStation 5', 'Xbox One', 'Nintendo Switch'],
    genres: ['RPG de Ação', 'Mundo Aberto', 'Fantasia'],
    averageHours: 52,
    synopsis: 'Controle Geralt de Rívia, um bruxo caçador de monstros em busca de Ciri, a Criança da Profecia, perseguida pela mística Caçada Selvagem.',
  },
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.webp',
    releaseYear: 2023,
    developer: 'Nintendo EPD',
    publisher: 'Nintendo',
    platforms: ['Nintendo Switch'],
    genres: ['Aventura', 'Ação', 'Mundo Aberto', 'Puzzle'],
    averageHours: 60,
    synopsis: 'Explore os céus, a superfície e as profundezas de Hyrule usando as novas habilidades de Link como a Ultrahand para salvar a Princesa Zelda e derrotar Ganondorf.',
  },
  {
    title: 'God of War Ragnarök',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5v.webp',
    releaseYear: 2022,
    developer: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    platforms: ['PlayStation 5', 'PlayStation 4', 'PC'],
    genres: ['Ação', 'Aventura', 'Hack and Slash'],
    averageHours: 28,
    synopsis: 'Kratos e Atreus devem explorar cada um dos Nove Reinos em busca de respostas enquanto as forças asgardianas se preparam para a profetizada batalha que trará o fim do mundo.',
  },
  {
    title: 'Hollow Knight',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co9387.webp',
    releaseYear: 2017,
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    platforms: ['PC', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
    genres: ['Metroidvania', 'Plataforma', 'Ação'],
    averageHours: 27,
    synopsis: 'Forje seu caminho em Hallownest! Uma aventura de ação 2D desafiadora através de um vasto reino em ruínas habitado por insetos e heróis.',
  },
  {
    title: 'Red Dead Redemption 2',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp',
    releaseYear: 2018,
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    platforms: ['PlayStation 4', 'Xbox One', 'PC'],
    genres: ['Ação', 'Aventura', 'Mundo Aberto', 'Faroeste'],
    averageHours: 50,
    synopsis: 'Estados Unidos, 1899. O fim da era do Velho Oeste começou. Arthur Morgan e a gangue Van der Linde são forçados a fugir através do coração da América.',
  },
  {
    title: 'Cyberpunk 2077',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4h5n.webp',
    releaseYear: 2020,
    developer: 'CD Projekt RED',
    publisher: 'CD Projekt',
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X/S', 'PlayStation 4', 'Xbox One'],
    genres: ['RPG de Ação', 'Ficção Científica', 'Mundo Aberto'],
    averageHours: 25,
    synopsis: 'Um RPG de ação e aventura em mundo aberto ambientado na megalópole de Night City, onde você joga como V, um mercenário cibernético.',
  },
  {
    title: 'Baldur\'s Gate 3',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.webp',
    releaseYear: 2023,
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X/S'],
    genres: ['RPG', 'Estratégia por Turnos', 'Fantasia'],
    averageHours: 75,
    synopsis: 'Reúna seu grupo e retorne aos Reinos Esquecidos em um conto de companheirismo e traição, sacrifício e sobrevivência, e a atração do poder absoluto.',
  },
  {
    title: 'Super Mario Odyssey',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1m1f.webp',
    releaseYear: 2017,
    developer: 'Nintendo EPD',
    publisher: 'Nintendo',
    platforms: ['Nintendo Switch'],
    genres: ['Plataforma', 'Aventura'],
    averageHours: 13,
    synopsis: 'Embarque em uma jornada 3D pelo mundo todo usando as habilidades inacreditáveis do chapéu Cappy para salvar a Princesa Peach do casamento forçado com Bowser.',
  },
  {
    title: 'Resident Evil 4 (Remake)',
    thumbnail: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5t0v.webp',
    releaseYear: 2023,
    developer: 'Capcom',
    publisher: 'Capcom',
    platforms: ['PlayStation 5', 'PlayStation 4', 'PC', 'Xbox Series X/S'],
    genres: ['Terror de Sobrevivência', 'Ação', 'Tiro em 3ª Pessoa'],
    averageHours: 16,
    synopsis: 'Seis anos se passaram desde o desastre biológico em Raccoon City. Leon S. Kennedy rastreia a filha sequestrada do presidente em uma vila remota na Europa.',
  },
];

// Helper to query Steam search for image thumbnail
async function searchSteamImage(gameName: string): Promise<string | null> {
  try {
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=english&cc=US`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        // Steam store header or vertical capsule
        return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900_2x.jpg` ||
               `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg` ||
               item.tiny_image;
      }
    }
  } catch {
    // ignore network timeout
  }
  return null;
}

// API endpoint to search game details from internet / Gemini / databases
app.post('/api/games/search', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. First check local curated database for instant <10ms response
  const localMatches = POPULAR_GAMES_FALLBACK.filter((g) =>
    g.title.toLowerCase().includes(cleanQuery) ||
    cleanQuery.includes(g.title.toLowerCase())
  );

  if (localMatches.length > 0) {
    return res.json({ games: localMatches, source: 'curated_database' });
  }

  // 2. Try Gemini with timeout
  if (ai) {
    try {
      const prompt = `Você é um catálogo especializado em videogames. O usuário está buscando pelo jogo: "${query}".
Retorne uma lista JSON com até 4 jogos mais relevantes que correspondam a essa busca.
Para cada jogo, retorne exatamente os campos:
- title: nome oficial completo do jogo
- thumbnail: URL de uma imagem de poster/capa vertical do jogo (preferência por links estáveis como Steam CDN, IGDB, Wikimedia Commons, ou Wikipedia, ex: https://images.igdb.com/... ou https://shared.akamai.steamstatic.com/... Se não souber a URL exata da imagem, forneça uma URL direta pública da capa ou deixe em branco que buscaremos automaticamente).
- releaseYear: ano de lançamento (número inteiro, ex: 2022)
- developer: estúdio desenvolvedor
- publisher: empresa publicadora
- platforms: array de strings com as principais plataformas/consoles (ex: ["PlayStation 5", "PC", "Nintendo Switch", "Xbox Series X/S"])
- genres: array de strings com gêneros em português (ex: ["RPG de Ação", "Aventura", "Mundo Aberto"])
- averageHours: tempo médio em horas para zerar a história principal (número, ex: 35)
- synopsis: resumo conciso em português (1 a 2 frases)`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                thumbnail: { type: Type.STRING },
                releaseYear: { type: Type.INTEGER },
                developer: { type: Type.STRING },
                publisher: { type: Type.STRING },
                platforms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                genres: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                averageHours: { type: Type.NUMBER },
                synopsis: { type: Type.STRING },
              },
              required: ['title', 'releaseYear', 'developer', 'platforms', 'genres'],
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de consulta Gemini')), 5000)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      const responseText = response?.text?.trim();

      if (responseText) {
        const games = JSON.parse(responseText);
        if (Array.isArray(games) && games.length > 0) {
          // Verify or enhance thumbnails with Steam search if thumbnail is empty or generic
          const enrichedGames = await Promise.all(
            games.map(async (g) => {
              let thumb = g.thumbnail;
              if (!thumb || !thumb.startsWith('http') || thumb.includes('example.com')) {
                const steamThumb = await searchSteamImage(g.title);
                if (steamThumb) thumb = steamThumb;
              }
              return {
                ...g,
                thumbnail: thumb || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80`,
              };
            })
          );
          return res.json({ games: enrichedGames, source: 'gemini' });
        }
      }
    } catch (err) {
      console.warn('Gemini search timed out or unavailable, falling back:', err);
    }
  }

  // Try direct Steam Search
  try {
    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=brazilian&cc=BR`;
    const steamRes = await fetch(steamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000),
    });
    if (steamRes.ok) {
      const steamData = await steamRes.json();
      if (steamData.items && steamData.items.length > 0) {
        const results = steamData.items.slice(0, 5).map((item: any) => ({
          title: item.name,
          thumbnail: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900_2x.jpg` ||
                     `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
          releaseYear: new Date().getFullYear(),
          developer: 'Desenvolvedora',
          publisher: 'Publicadora',
          platforms: ['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch'],
          genres: ['Ação', 'Aventura'],
          averageHours: 20,
          synopsis: `Jogo encontrado na biblioteca Steam: ${item.name}.`,
        }));
        return res.json({ games: results, source: 'steam_search' });
      }
    }
  } catch (steamErr) {
    console.error('Steam search error:', steamErr);
  }

    // Generic fallback if nothing found
    return res.json({
      games: [
        {
          title: query,
          thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          releaseYear: new Date().getFullYear(),
          developer: 'Estúdio Independente',
          publisher: 'Publicadora',
          platforms: ['PC', 'PlayStation 5', 'Nintendo Switch', 'Xbox Series X/S'],
          genres: ['Ação', 'Aventura'],
          averageHours: 15,
          synopsis: `Jogo cadastrado: ${query}. Você pode preencher os detalhes complementares nos campos abaixo.`,
        },
      ],
      source: 'custom_generic',
    });
  });

  // Dedicated endpoint to fetch or generate rich synopsis for a game
  app.post('/api/games/synopsis', async (req: Request, res: Response) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const cleanTitle = title.trim().toLowerCase();

    // 1. Check curated database first
    const match = POPULAR_GAMES_FALLBACK.find(
      (g) => g.title.toLowerCase().includes(cleanTitle) || cleanTitle.includes(g.title.toLowerCase())
    );
    if (match && match.synopsis) {
      return res.json({
        synopsis: match.synopsis,
        developer: match.developer,
        publisher: match.publisher,
        releaseYear: match.releaseYear,
        genres: match.genres,
      });
    }

    // 2. Try Gemini
    if (ai) {
      try {
        const prompt = `Escreva uma sinopse envolvente, concisa e de alta qualidade em Português do Brasil (2 a 4 frases) para o jogo "${title}".
Destaque a premissa da história, o protagonista ou objetivo principal, e o estilo de jogabilidade.
Retorne um JSON com os campos:
- synopsis: texto da sinopse em português
- developer: estúdio desenvolvedor provável
- releaseYear: ano de lançamento (número)
- genres: array com 2 ou 3 gêneros em português`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                synopsis: { type: Type.STRING },
                developer: { type: Type.STRING },
                releaseYear: { type: Type.INTEGER },
                genres: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['synopsis'],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de consulta')), 4500)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response?.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.synopsis) {
            return res.json(parsed);
          }
        }
      } catch (err) {
        console.warn('Gemini synopsis fetch error, falling back:', err);
      }
    }

    // 3. Fallback synopsis
    return res.json({
      synopsis: `${title} é uma jornada marcante repleta de desafios, exploração e momentos memoráveis, oferecendo uma experiência imersiva para o jogador.`,
    });
  });

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const http = await import('http');
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false, // Explicitly disable WebSocket HMR transport to prevent iframe connection errors
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GameVault Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
