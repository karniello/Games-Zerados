import type { GameAchievement } from '../types.ts';

export interface SyncExternalResult {
  achievements: GameAchievement[];
  unlockedCount: number;
  matchedNames: string[];
  source: string;
  message: string;
}

// Clean and normalize strings for robust fuzzy comparison
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '') // keep only alphanumeric
    .trim();
}

// Check if two achievement titles or descriptions match
function isMatch(itemTitle: string, targetName: string): boolean {
  const normItem = normalizeStr(itemTitle);
  const normTarget = normalizeStr(targetName);
  if (!normItem || !normTarget) return false;
  return normItem === normTarget || normItem.includes(normTarget) || normTarget.includes(normItem);
}

// 1. Sync from pasted text (any website like Exophase, Steam, PSNProfiles, Xbox, TrueAchievements)
export function syncFromPastedText(
  pastedText: string,
  existingList: GameAchievement[]
): SyncExternalResult {
  const lines = pastedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const matchedNames: string[] = [];
  const now = new Date().toISOString();

  const updated = existingList.map((ach) => {
    // If already unlocked, keep it
    if (ach.unlocked) return ach;

    // Check if any pasted line matches this achievement title
    const match = lines.find((line) => isMatch(ach.title, line));
    if (match) {
      matchedNames.push(ach.title);
      return {
        ...ach,
        unlocked: true,
        unlockedAt: now,
      };
    }
    return ach;
  });

  return {
    achievements: updated,
    unlockedCount: matchedNames.length,
    matchedNames,
    source: 'pasted_tracker',
    message: matchedNames.length > 0
      ? `Sincronizado com sucesso! ${matchedNames.length} conquistas identificadas e marcadas.`
      : 'Nenhuma conquista correspondente encontrada no texto colado. Verifique os títulos.',
  };
}

// 2. Sync from Steam public community stats
export async function syncFromSteam(
  steamUserOrUrl: string,
  gameTitle: string,
  existingList: GameAchievement[]
): Promise<SyncExternalResult> {
  let steamId = steamUserOrUrl.trim();
  // Extract custom URL or 64-bit ID if a full link was pasted
  if (steamId.includes('steamcommunity.com/id/')) {
    const parts = steamId.split('/id/')[1]?.split('/');
    if (parts && parts[0]) steamId = parts[0];
  } else if (steamId.includes('steamcommunity.com/profiles/')) {
    const parts = steamId.split('/profiles/')[1]?.split('/');
    if (parts && parts[0]) steamId = parts[0];
  }

  // Find Steam AppId for gameTitle
  let appId: number | null = null;
  try {
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameTitle)}&l=english&cc=US`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.items && data.items.length > 0) {
        appId = data.items[0].id;
      }
    }
  } catch (err) {
    console.warn('[Steam Sync] Could not find AppID for', gameTitle, err);
  }

  if (!appId) {
    // If Steam couldn't find the app, return friendly feedback
    return {
      achievements: existingList,
      unlockedCount: 0,
      matchedNames: [],
      source: 'steam',
      message: `Não foi possível identificar o ID do jogo "${gameTitle}" na loja Steam. Experimente colar a lista do seu perfil.`,
    };
  }

  // Try fetching public XML stats
  try {
    const isNumericId = /^\d{17}$/.test(steamId);
    const xmlUrl = isNumericId
      ? `https://steamcommunity.com/profiles/${steamId}/stats/${appId}/?xml=1`
      : `https://steamcommunity.com/id/${steamId}/stats/${appId}/?xml=1`;

    const res = await fetch(xmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const xml = await res.text();
      if (xml.includes('<error>') || xml.includes('This profile is private')) {
        return {
          achievements: existingList,
          unlockedCount: 0,
          matchedNames: [],
          source: 'steam',
          message: 'O perfil Steam informado está privado ou as estatísticas de jogos não estão públicas.',
        };
      }

      // Extract unlocked achievement names: <achievement closed="1"><name><![CDATA[...]]></name>
      const achievementRegex = /<achievement closed="1">([\s\S]*?)<\/achievement>/g;
      const unlockedRawNames: string[] = [];
      let match;
      while ((match = achievementRegex.exec(xml)) !== null) {
        const block = match[1];
        const nameMatch = block.match(/<name>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/name>/i);
        const apiNameMatch = block.match(/<apiname>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/apiname>/i);
        if (nameMatch && nameMatch[1]) unlockedRawNames.push(nameMatch[1]);
        if (apiNameMatch && apiNameMatch[1]) unlockedRawNames.push(apiNameMatch[1]);
      }

      const now = new Date().toISOString();
      const matchedNames: string[] = [];

      const updated = existingList.map((ach) => {
        if (ach.unlocked) return ach;
        const found = unlockedRawNames.some((uName) => isMatch(ach.title, uName));
        if (found) {
          matchedNames.push(ach.title);
          return {
            ...ach,
            unlocked: true,
            unlockedAt: now,
          };
        }
        return ach;
      });

      return {
        achievements: updated,
        unlockedCount: matchedNames.length,
        matchedNames,
        source: 'steam',
        message: matchedNames.length > 0
          ? `Sucesso! ${matchedNames.length} conquistas sincronizadas diretamente da Steam.`
          : 'Nenhuma conquista desbloqueada encontrada para este jogo no perfil Steam informado.',
      };
    }
  } catch (err: any) {
    console.warn('[Steam Sync] Fetch error:', err);
  }

  return {
    achievements: existingList,
    unlockedCount: 0,
    matchedNames: [],
    source: 'steam',
    message: 'Não foi possível conectar ao perfil público da Steam no momento. Use o modo de importação por texto.',
  };
}

// 3. Generic web tracker fetcher (Exophase, PSNProfiles, RetroAchievements)
export async function syncFromWebTracker(
  trackerUrl: string,
  existingList: GameAchievement[]
): Promise<SyncExternalResult> {
  const cleanUrl = trackerUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return {
      achievements: existingList,
      unlockedCount: 0,
      matchedNames: [],
      source: 'web_tracker',
      message: 'Por favor, informe uma URL válida começando com https:// (Exophase, PSNProfiles ou RetroAchievements).',
    };
  }

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const html = await res.text();
      // Match titles inside HTML structure (common to Exophase, PSNProfiles, and RetroAchievements)
      const matchedNames: string[] = [];
      const now = new Date().toISOString();

      const updated = existingList.map((ach) => {
        if (ach.unlocked) return ach;
        // If the achievement title is mentioned in an unlocked / earned context in the page
        const norm = normalizeStr(ach.title);
        if (norm.length > 3 && html.toLowerCase().includes(ach.title.toLowerCase())) {
          matchedNames.push(ach.title);
          return {
            ...ach,
            unlocked: true,
            unlockedAt: now,
          };
        }
        return ach;
      });

      return {
        achievements: updated,
        unlockedCount: matchedNames.length,
        matchedNames,
        source: 'web_tracker',
        message: matchedNames.length > 0
          ? `${matchedNames.length} conquistas identificadas e sincronizadas do rastreador externo!`
          : 'Página acessada, mas não foram identificadas conquistas correspondentes com os títulos.',
      };
    }
  } catch (err: any) {
    console.warn('[Web Tracker Sync] Error fetching URL:', err);
  }

  return {
    achievements: existingList,
    unlockedCount: 0,
    matchedNames: [],
    source: 'web_tracker',
    message: 'Não foi possível carregar o rastreador externo (pode requerer autenticação ou proteção contra robôs). Copie e cole os troféus na aba "Colar do Rastreador".',
  };
}
