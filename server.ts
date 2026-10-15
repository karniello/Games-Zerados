import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserByUid } from './src/db/users.ts';
import {
  getGamesByDbUserId,
  saveOrUpdateGame,
  deleteGame,
  toggleGameFavorite,
  bulkSyncGames,
} from './src/db/games.ts';
import { getGoalByDbUserIdAndYear, saveGoalForDbUser } from './src/db/goals.ts';

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

// Helper to map English genres to Portuguese options in GameVault
function mapGenreToPt(rawGenre?: string): string {
  if (!rawGenre) return 'Ação';
  const g = rawGenre.toLowerCase();
  if (g.includes('action rpg') || g.includes('rpg') || g.includes('role-playing')) return 'RPG de Ação';
  if (g.includes('action') || g.includes('ação')) return 'Ação';
  if (g.includes('adventure') || g.includes('aventura')) return 'Aventura';
  if (g.includes('shooter') || g.includes('fps') || g.includes('tiro')) return 'Tiro / FPS / TPS';
  if (g.includes('fighting') || g.includes('luta')) return 'Luta';
  if (g.includes('racing') || g.includes('corrida') || g.includes('driving')) return 'Corrida / Simulador';
  if (g.includes('strategy') || g.includes('tactical') || g.includes('estratégia')) return 'Estratégia / Tático';
  if (g.includes('puzzle') || g.includes('quebra-cabeça')) return 'Puzzle / Quebra-cabeça';
  if (g.includes('platform') || g.includes('plataforma')) return 'Plataforma 2D/3D';
  if (g.includes('horror') || g.includes('survival horror') || g.includes('terror')) return 'Terror de Sobrevivência';
  if (g.includes('souls') || g.includes('soulslike')) return 'Souls-like';
  if (g.includes('metroidvania')) return 'Metroidvania';
  if (g.includes('open world') || g.includes('mundo aberto')) return 'Mundo Aberto';
  if (g.includes('hack and slash') || g.includes('slash')) return 'Hack and Slash';
  return rawGenre;
}

// Helper to map English platforms to GameVault platforms
function mapPlatformToPt(rawPlatform?: string): string {
  if (!rawPlatform) return 'PlayStation 5';
  const p = rawPlatform.toLowerCase();
  if (p.includes('playstation 5') || p === 'ps5') return 'PlayStation 5';
  if (p.includes('playstation 4') || p === 'ps4') return 'PlayStation 4';
  if (p.includes('playstation 3') || p === 'ps3') return 'PlayStation 3';
  if (p.includes('playstation 2') || p === 'ps2') return 'PlayStation 2';
  if (p.includes('playstation') || p === 'ps1' || p === 'psx') return 'PlayStation 1';
  if (p.includes('switch')) return 'Nintendo Switch';
  if (p.includes('series x') || p.includes('series s') || p.includes('xbox series')) return 'Xbox Series X/S';
  if (p.includes('xbox one')) return 'Xbox One';
  if (p.includes('xbox 360')) return 'Xbox 360';
  if (p.includes('pc') || p.includes('windows') || p.includes('steam') || p.includes('mac') || p.includes('linux')) return 'PC (Steam / Epic)';
  if (p.includes('android') || p.includes('ios') || p.includes('mobile')) return 'Mobile (iOS / Android)';
  return 'Outro';
}

// Twitch / IGDB Access Token Cache
let cachedIgdbToken: { token: string; expiresAt: number } | null = null;

async function getIgdbAccessToken(): Promise<string | null> {
  if (process.env.IGDB_ACCESS_TOKEN) {
    return process.env.IGDB_ACCESS_TOKEN;
  }
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (cachedIgdbToken && Date.now() < cachedIgdbToken.expiresAt) {
    return cachedIgdbToken.token;
  }

  try {
    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
    const res = await fetch(tokenUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn('[IGDB] Failed to acquire Twitch OAuth token:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    cachedIgdbToken = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(60, (data.expires_in - 300)) * 1000,
    };
    return cachedIgdbToken.token;
  } catch (err) {
    console.error('[IGDB] Error requesting Twitch token:', err);
    return null;
  }
}

// Search IGDB API v4
async function searchIgdbGames(query: string): Promise<any[] | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const token = await getIgdbAccessToken();
  if (!clientId || !token) return null;

  try {
    const clean = query.replace(/"/g, '\\"');
    const body = `search "${clean}"; fields name, cover.image_id, cover.url, first_release_date, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, platforms.name, genres.name, summary, storyline, total_rating; limit 6;`;

    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn('[IGDB] Query failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((item: any) => {
      let thumbnail = '';
      if (item.cover?.image_id) {
        thumbnail = `https://images.igdb.com/igdb/image/upload/t_cover_big/${item.cover.image_id}.jpg`;
      } else if (item.cover?.url) {
        thumbnail = item.cover.url.startsWith('//') ? `https:${item.cover.url}` : item.cover.url;
      }

      let developer: string | undefined;
      let publisher: string | undefined;
      if (Array.isArray(item.involved_companies)) {
        const dev = item.involved_companies.find((c: any) => c.developer);
        if (dev?.company?.name) developer = dev.company.name;
        const pub = item.involved_companies.find((c: any) => c.publisher);
        if (pub?.company?.name) publisher = pub.company.name;
      }

      const releaseYear = item.first_release_date
        ? new Date(item.first_release_date * 1000).getFullYear()
        : undefined;

      const genres = Array.isArray(item.genres)
        ? item.genres.map((g: any) => mapGenreToPt(g.name))
        : ['Ação'];

      const platforms = Array.isArray(item.platforms)
        ? Array.from(new Set(item.platforms.map((p: any) => mapPlatformToPt(p.name))))
        : ['PlayStation 5'];

      return {
        title: item.name,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        releaseYear,
        developer: developer || 'Estúdio',
        publisher: publisher || undefined,
        platforms,
        genres,
        synopsis: item.summary || item.storyline || '',
        source: 'igdb',
      };
    });
  } catch (err) {
    console.error('[IGDB] Search error:', err);
    return null;
  }
}

// Search RAWG Video Games Database API
async function searchRawgGames(query: string): Promise<any[] | null> {
  const rawgKey = process.env.RAWG_API_KEY;
  if (!rawgKey) return null;

  try {
    const searchUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&key=${rawgKey}&page_size=6`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      console.warn('[RAWG] Search failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return [];
    }

    // Enrich top results with developer/publisher details from game detail endpoint
    const enriched = await Promise.all(
      data.results.map(async (item: any, idx: number) => {
        let developer: string | undefined;
        let publisher: string | undefined;
        let detailedSynopsis: string | undefined;

        if (idx < 4) {
          try {
            const detailRes = await fetch(
              `https://api.rawg.io/api/games/${item.id}?key=${rawgKey}`,
              { signal: AbortSignal.timeout(3000) }
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.developers && detailData.developers.length > 0) {
                developer = detailData.developers[0].name;
              }
              if (detailData.publishers && detailData.publishers.length > 0) {
                publisher = detailData.publishers[0].name;
              }
              if (detailData.description_raw) {
                detailedSynopsis = detailData.description_raw.slice(0, 320) + (detailData.description_raw.length > 320 ? '...' : '');
              }
            }
          } catch {
            // detail fetch timed out, fallback to basic info
          }
        }

        const releaseYear = item.released ? parseInt(item.released.split('-')[0], 10) : undefined;
        const genres = Array.isArray(item.genres) && item.genres.length > 0
          ? Array.from(new Set(item.genres.map((g: any) => mapGenreToPt(g.name))))
          : ['Ação'];
        const platforms = Array.isArray(item.platforms) && item.platforms.length > 0
          ? Array.from(new Set(item.platforms.map((p: any) => mapPlatformToPt(p.platform?.name))))
          : ['PlayStation 5'];

        return {
          title: item.name,
          thumbnail: item.background_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
          releaseYear,
          developer: developer || 'Estúdio',
          publisher: publisher || undefined,
          genres,
          platforms,
          averageHours: item.playtime ? Math.round(item.playtime) : undefined,
          synopsis: detailedSynopsis || `Jogo ${item.name} lançado em ${releaseYear || 'data não informada'}.`,
          source: 'rawg',
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error('[RAWG] Search error:', err);
    return null;
  }
}

// Endpoint to check status of game metadata search APIs
app.get('/api/games/search/status', (_req: Request, res: Response) => {
  const rawgConfigured = Boolean(process.env.RAWG_API_KEY);
  const igdbConfigured = Boolean(
    (process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET) ||
    process.env.IGDB_ACCESS_TOKEN
  );
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  let activeProvider = 'Curated Database & Steam Search';
  if (rawgConfigured && igdbConfigured) {
    activeProvider = 'RAWG API & IGDB API';
  } else if (rawgConfigured) {
    activeProvider = 'RAWG API';
  } else if (igdbConfigured) {
    activeProvider = 'IGDB API';
  } else if (geminiConfigured) {
    activeProvider = 'Gemini AI & Steam';
  }

  return res.json({
    rawgConfigured,
    igdbConfigured,
    geminiConfigured,
    activeProvider,
  });
});

// API endpoint to search game details from RAWG / IGDB / Gemini / Steam / databases
app.post('/api/games/search', async (req: Request, res: Response) => {
  const { query, preferredProvider } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Termo de busca é obrigatório' });
  }

  const cleanQuery = query.trim().toLowerCase();

  // 1. Try RAWG API if configured
  if (!preferredProvider || preferredProvider === 'rawg' || preferredProvider === 'auto') {
    const rawgResults = await searchRawgGames(query.trim());
    if (rawgResults && rawgResults.length > 0) {
      return res.json({ games: rawgResults, source: 'rawg' });
    }
  }

  // 2. Try IGDB API if configured
  if (!preferredProvider || preferredProvider === 'igdb' || preferredProvider === 'auto') {
    const igdbResults = await searchIgdbGames(query.trim());
    if (igdbResults && igdbResults.length > 0) {
      return res.json({ games: igdbResults, source: 'igdb' });
    }
  }

  // 3. Check local curated database for instant <10ms response
  const localMatches = POPULAR_GAMES_FALLBACK.filter((g) =>
    g.title.toLowerCase().includes(cleanQuery) ||
    cleanQuery.includes(g.title.toLowerCase())
  ).map((g) => ({ ...g, source: 'curated_database' }));

  if (localMatches.length > 0) {
    return res.json({ games: localMatches, source: 'curated_database' });
  }

  // 4. Try Gemini with timeout and enrich with Steam cover
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
                source: 'gemini',
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

  // 5. Try direct Steam Store Search
  try {
    const steamUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=brazilian&cc=BR`;
    const steamRes = await fetch(steamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4000),
    });
    if (steamRes.ok) {
      const steamData = await steamRes.json();
      if (steamData.items && steamData.items.length > 0) {
        const results = steamData.items.slice(0, 6).map((item: any) => ({
          title: item.name,
          thumbnail: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900_2x.jpg` ||
                     `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
          releaseYear: new Date().getFullYear(),
          developer: 'Desenvolvedora',
          publisher: 'Publicadora',
          platforms: ['PC (Steam / Epic)', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch'],
          genres: ['Ação', 'Aventura'],
          averageHours: 20,
          synopsis: `Jogo encontrado na biblioteca Steam: ${item.name}.`,
          source: 'steam',
        }));
        return res.json({ games: results, source: 'steam' });
      }
    }
  } catch (steamErr) {
    console.error('Steam search error:', steamErr);
  }

  // 6. Generic fallback if nothing found
  return res.json({
    games: [
      {
        title: query,
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        releaseYear: new Date().getFullYear(),
        developer: 'Estúdio Independente',
        publisher: 'Publicadora',
        platforms: ['PlayStation 5', 'PC (Steam / Epic)', 'Nintendo Switch', 'Xbox Series X/S'],
        genres: ['Ação', 'Aventura'],
        averageHours: 15,
        synopsis: `Jogo cadastrado: ${query}. Você pode preencher os detalhes complementares nos campos abaixo.`,
        source: 'fallback',
      },
    ],
    source: 'fallback',
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

  // Helper to resolve or create database user from authenticated request
  async function resolveDbUser(req: AuthRequest) {
    if (!req.user || !req.user.uid) {
      throw new Error('Usuário não autenticado.');
    }
    const dbUser = await getOrCreateUser({
      uid: req.user.uid,
      email: req.user.email || `${req.user.uid}@gamer.local`,
      name: (req.user.name as string) || undefined,
      avatar: (req.user.picture as string) || undefined,
    });
    return dbUser;
  }

  // 1. User & Auth Sync
  app.get('/api/user/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      return res.json({
        id: dbUser.uid,
        dbId: dbUser.id,
        username: dbUser.username || dbUser.email.split('@')[0],
        name: dbUser.name || dbUser.username || 'Gamer',
        email: dbUser.email,
        avatar: dbUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(dbUser.uid)}`,
        gamerTag: dbUser.gamerTag || `GAMER#${dbUser.id}`,
        favoritePlatform: dbUser.favoritePlatform || 'PlayStation 5',
      });
    } catch (error: any) {
      console.error('Failed to get user profile:', error);
      return res.status(500).json({ error: error.message || 'Erro ao carregar perfil' });
    }
  });

  app.post('/api/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { name, gamerTag, favoritePlatform, avatar } = req.body;
      if (!req.user?.uid) {
        return res.status(401).json({ error: 'Não autorizado' });
      }
      const updated = await getOrCreateUser({
        uid: req.user.uid,
        email: req.user.email || `${req.user.uid}@gamer.local`,
        name,
        gamerTag,
        favoritePlatform,
        avatar,
      });
      return res.json({
        id: updated.uid,
        username: updated.username,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        gamerTag: updated.gamerTag,
        favoritePlatform: updated.favoritePlatform,
      });
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar perfil' });
    }
  });

  // 2. Games API
  app.get('/api/games', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const userGames = await getGamesByDbUserId(dbUser.id);
      return res.json({ games: userGames });
    } catch (error: any) {
      console.error('Failed to fetch games:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar jogos' });
    }
  });

  app.post('/api/games', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const { game, existingId } = req.body;
      if (!game || !game.title) {
        return res.status(400).json({ error: 'Dados do jogo inválidos' });
      }
      const saved = await saveOrUpdateGame(dbUser.id, game, existingId);
      return res.json({ game: saved });
    } catch (error: any) {
      console.error('Failed to save game:', error);
      return res.status(500).json({ error: error.message || 'Erro ao salvar jogo' });
    }
  });

  app.delete('/api/games/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const gameId = req.params.id;
      const success = await deleteGame(dbUser.id, gameId);
      return res.json({ success });
    } catch (error: any) {
      console.error('Failed to delete game:', error);
      return res.status(500).json({ error: error.message || 'Erro ao excluir jogo' });
    }
  });

  app.patch('/api/games/:id/favorite', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const gameId = req.params.id;
      const favorite = await toggleGameFavorite(dbUser.id, gameId);
      return res.json({ favorite });
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      return res.status(500).json({ error: error.message || 'Erro ao alternar favorito' });
    }
  });

  app.post('/api/games/sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const { games: incomingGames } = req.body;
      if (!Array.isArray(incomingGames)) {
        return res.status(400).json({ error: 'Lista de jogos inválida' });
      }
      const synced = await bulkSyncGames(dbUser.id, incomingGames);
      return res.json({ games: synced });
    } catch (error: any) {
      console.error('Failed to sync games:', error);
      return res.status(500).json({ error: error.message || 'Erro ao sincronizar jogos' });
    }
  });

  // 3. Yearly Goals API
  app.get('/api/goals/:year', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const year = parseInt(req.params.year, 10) || new Date().getFullYear();
      const goal = await getGoalByDbUserIdAndYear(dbUser.id, year);
      return res.json({ goal });
    } catch (error: any) {
      console.error('Failed to fetch goals:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar metas' });
    }
  });

  app.post('/api/goals', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const dbUser = await resolveDbUser(req);
      const { goal } = req.body;
      if (!goal || typeof goal.year !== 'number') {
        return res.status(400).json({ error: 'Meta inválida' });
      }
      const saved = await saveGoalForDbUser(dbUser.id, goal);
      return res.json({ goal: saved });
    } catch (error: any) {
      console.error('Failed to save goal:', error);
      return res.status(500).json({ error: error.message || 'Erro ao salvar meta' });
    }
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
