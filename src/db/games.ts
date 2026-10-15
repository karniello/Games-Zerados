import { db } from './index.ts';
import { games } from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';
import type { Game } from '../types.ts';
import { INITIAL_GAMES } from '../constants/initialData.ts';

// In-memory fallback games store per user
const inMemoryGamesByUser = new Map<number, Game[]>();

function getInMemoryGames(userId: number): Game[] {
  if (!inMemoryGamesByUser.has(userId)) {
    inMemoryGamesByUser.set(userId, [...INITIAL_GAMES]);
  }
  return inMemoryGamesByUser.get(userId)!;
}

export async function getGamesByDbUserId(userId: number): Promise<Game[]> {
  if (db) {
    try {
      const records = await db
        .select()
        .from(games)
        .where(eq(games.userId, userId))
        .orderBy(desc(games.completedDate));

      return records.map((r) => ({
        id: r.id,
        title: r.title,
        thumbnail: r.thumbnail,
        platform: r.platform,
        genre: r.genre,
        completionCondition: r.completionCondition as any,
        rating: r.rating,
        difficulty: r.difficulty as any,
        hours: r.hours,
        completedDate: r.completedDate,
        releaseYear: r.releaseYear ?? undefined,
        developer: r.developer ?? undefined,
        publisher: r.publisher ?? undefined,
        synopsis: r.synopsis ?? undefined,
        notes: r.notes ?? undefined,
        favorite: !!r.favorite,
        achievements: r.achievements ? (JSON.parse(r.achievements) as any) : undefined,
        achievementSummary: r.achievementSummary ? (JSON.parse(r.achievementSummary) as any) : undefined,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      }));
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL getGames query failed, using in-memory store:', error);
    }
  }

  return getInMemoryGames(userId);
}

export async function saveOrUpdateGame(
  userId: number,
  game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<Game> {
  const now = new Date();
  const gameId = existingId || `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (db) {
    try {


    if (existingId) {
      const [updated] = await db
        .update(games)
        .set({
          title: game.title,
          thumbnail: game.thumbnail,
          platform: game.platform,
          genre: game.genre,
          completionCondition: game.completionCondition,
          rating: game.rating,
          difficulty: game.difficulty,
          hours: game.hours,
          completedDate: game.completedDate,
          releaseYear: game.releaseYear ?? null,
          developer: game.developer ?? null,
          publisher: game.publisher ?? null,
          synopsis: game.synopsis ?? null,
          notes: game.notes ?? null,
          favorite: !!game.favorite,
          achievements: game.achievements ? JSON.stringify(game.achievements) : null,
          achievementSummary: game.achievementSummary ? JSON.stringify(game.achievementSummary) : null,
          updatedAt: now,
        })
        .where(and(eq(games.id, existingId), eq(games.userId, userId)))
        .returning();

      if (!updated) {
        throw new Error('Game not found or not owned by user.');
      }

      return {
        id: updated.id,
        title: updated.title,
        thumbnail: updated.thumbnail,
        platform: updated.platform,
        genre: updated.genre,
        completionCondition: updated.completionCondition as any,
        rating: updated.rating,
        difficulty: updated.difficulty as any,
        hours: updated.hours,
        completedDate: updated.completedDate,
        releaseYear: updated.releaseYear ?? undefined,
        developer: updated.developer ?? undefined,
        publisher: updated.publisher ?? undefined,
        synopsis: updated.synopsis ?? undefined,
        notes: updated.notes ?? undefined,
        favorite: !!updated.favorite,
        achievements: updated.achievements ? (JSON.parse(updated.achievements) as any) : undefined,
        achievementSummary: updated.achievementSummary ? (JSON.parse(updated.achievementSummary) as any) : undefined,
        createdAt: updated.createdAt?.toISOString() || now.toISOString(),
        updatedAt: updated.updatedAt?.toISOString() || now.toISOString(),
      };
    }

    const [created] = await db
      .insert(games)
      .values({
        id: gameId,
        userId,
        title: game.title,
        thumbnail: game.thumbnail,
        platform: game.platform,
        genre: game.genre,
        completionCondition: game.completionCondition,
        rating: game.rating,
        difficulty: game.difficulty,
        hours: game.hours,
        completedDate: game.completedDate,
        releaseYear: game.releaseYear ?? null,
        developer: game.developer ?? null,
        publisher: game.publisher ?? null,
        synopsis: game.synopsis ?? null,
        notes: game.notes ?? null,
        favorite: !!game.favorite,
        achievements: game.achievements ? JSON.stringify(game.achievements) : null,
        achievementSummary: game.achievementSummary ? JSON.stringify(game.achievementSummary) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      id: created.id,
      title: created.title,
      thumbnail: created.thumbnail,
      platform: created.platform,
      genre: created.genre,
      completionCondition: created.completionCondition as any,
      rating: created.rating,
      difficulty: created.difficulty as any,
      hours: created.hours,
      completedDate: created.completedDate,
      releaseYear: created.releaseYear ?? undefined,
      developer: created.developer ?? undefined,
      publisher: created.publisher ?? undefined,
      synopsis: created.synopsis ?? undefined,
      notes: created.notes ?? undefined,
      favorite: !!created.favorite,
      achievements: created.achievements ? (JSON.parse(created.achievements) as any) : undefined,
      achievementSummary: created.achievementSummary ? (JSON.parse(created.achievementSummary) as any) : undefined,
      createdAt: created.createdAt?.toISOString() || now.toISOString(),
      updatedAt: created.updatedAt?.toISOString() || now.toISOString(),
    };
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL saveOrUpdateGame failed, using in-memory store:', error);
    }
  }

  // In-memory fallback
  const userGames = getInMemoryGames(userId);
  if (existingId) {
    const idx = userGames.findIndex((g) => g.id === existingId);
    if (idx !== -1) {
      const updated: Game = {
        ...userGames[idx],
        ...game,
        updatedAt: now.toISOString(),
      };
      userGames[idx] = updated;
      return updated;
    }
  }

  const newGame: Game = {
    ...game,
    id: gameId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  userGames.unshift(newGame);
  return newGame;
}

export async function deleteGame(userId: number, gameId: string): Promise<boolean> {
  if (db) {
    try {
      const res = await db
        .delete(games)
        .where(and(eq(games.id, gameId), eq(games.userId, userId)))
        .returning({ id: games.id });
      return res.length > 0;
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL deleteGame failed, using in-memory store:', error);
    }
  }

  const userGames = getInMemoryGames(userId);
  const idx = userGames.findIndex((g) => g.id === gameId);
  if (idx !== -1) {
    userGames.splice(idx, 1);
    return true;
  }
  return false;
}

export async function toggleGameFavorite(userId: number, gameId: string): Promise<boolean> {
  if (db) {
    try {
      const existing = await db
        .select({ favorite: games.favorite })
        .from(games)
        .where(and(eq(games.id, gameId), eq(games.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        const nextVal = !existing[0].favorite;
        await db
          .update(games)
          .set({ favorite: nextVal, updatedAt: new Date() })
          .where(and(eq(games.id, gameId), eq(games.userId, userId)));

        return nextVal;
      }
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL toggleGameFavorite failed, using in-memory store:', error);
    }
  }

  const userGames = getInMemoryGames(userId);
  const game = userGames.find((g) => g.id === gameId);
  if (game) {
    game.favorite = !game.favorite;
    game.updatedAt = new Date().toISOString();
    return game.favorite;
  }
  return false;
}

export async function bulkSyncGames(userId: number, gamesList: Game[]): Promise<Game[]> {
  if (db) {
    try {
      // Delete existing games for user and insert all provided games
      await db.delete(games).where(eq(games.userId, userId));

      if (gamesList.length === 0) {
        return [];
      }

      const values = gamesList.map((g) => ({
        id: g.id || `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        title: g.title,
        thumbnail: g.thumbnail,
        platform: g.platform,
        genre: g.genre,
        completionCondition: g.completionCondition,
        rating: g.rating,
        difficulty: g.difficulty,
        hours: g.hours,
        completedDate: g.completedDate,
        releaseYear: g.releaseYear ?? null,
        developer: g.developer ?? null,
        publisher: g.publisher ?? null,
        synopsis: g.synopsis ?? null,
        notes: g.notes ?? null,
        favorite: !!g.favorite,
        achievements: g.achievements ? JSON.stringify(g.achievements) : null,
        achievementSummary: g.achievementSummary ? JSON.stringify(g.achievementSummary) : null,
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
        updatedAt: g.updatedAt ? new Date(g.updatedAt) : new Date(),
      }));

      await db.insert(games).values(values);
      return getGamesByDbUserId(userId);
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL bulkSyncGames failed, using in-memory store:', error);
    }
  }

  inMemoryGamesByUser.set(userId, [...gamesList]);
  return gamesList;
}

