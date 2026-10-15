import { db } from './index.ts';
import { games } from './schema.ts';
import { and, desc, eq } from 'drizzle-orm';
import type { Game } from '../types.ts';

export async function getGamesByDbUserId(userId: number): Promise<Game[]> {
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
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('getGamesByDbUserId failed:', error);
    throw new Error('Failed to retrieve games from database.', { cause: error });
  }
}

export async function saveOrUpdateGame(
  userId: number,
  game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<Game> {
  try {
    const now = new Date();
    const gameId = existingId || `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
      createdAt: created.createdAt?.toISOString() || now.toISOString(),
      updatedAt: created.updatedAt?.toISOString() || now.toISOString(),
    };
  } catch (error) {
    console.error('saveOrUpdateGame failed:', error);
    throw new Error('Failed to save game.', { cause: error });
  }
}

export async function deleteGame(userId: number, gameId: string): Promise<boolean> {
  try {
    const res = await db
      .delete(games)
      .where(and(eq(games.id, gameId), eq(games.userId, userId)))
      .returning({ id: games.id });
    return res.length > 0;
  } catch (error) {
    console.error('deleteGame failed:', error);
    throw new Error('Failed to delete game.', { cause: error });
  }
}

export async function toggleGameFavorite(userId: number, gameId: string): Promise<boolean> {
  try {
    const existing = await db
      .select({ favorite: games.favorite })
      .from(games)
      .where(and(eq(games.id, gameId), eq(games.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error('Game not found.');
    }

    const nextVal = !existing[0].favorite;
    await db
      .update(games)
      .set({ favorite: nextVal, updatedAt: new Date() })
      .where(and(eq(games.id, gameId), eq(games.userId, userId)));

    return nextVal;
  } catch (error) {
    console.error('toggleGameFavorite failed:', error);
    throw new Error('Failed to toggle game favorite.', { cause: error });
  }
}

export async function bulkSyncGames(userId: number, gamesList: Game[]): Promise<Game[]> {
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
      createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
      updatedAt: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    }));

    await db.insert(games).values(values);
    return getGamesByDbUserId(userId);
  } catch (error) {
    console.error('bulkSyncGames failed:', error);
    throw new Error('Failed to sync games in database.', { cause: error });
  }
}
