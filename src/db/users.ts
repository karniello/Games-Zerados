import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserInput {
  uid: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  gamerTag?: string;
  favoritePlatform?: string;
}

export async function getOrCreateUser(input: UserInput) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, input.uid)).limit(1);
    if (existing.length > 0) {
      if (input.name || input.avatar || input.gamerTag || input.favoritePlatform) {
        const [updated] = await db.update(users)
          .set({
            name: input.name ?? existing[0].name,
            avatar: input.avatar ?? existing[0].avatar,
            gamerTag: input.gamerTag ?? existing[0].gamerTag,
            favoritePlatform: input.favoritePlatform ?? existing[0].favoritePlatform,
          })
          .where(eq(users.uid, input.uid))
          .returning();
        return updated;
      }
      return existing[0];
    }

    const defaultUsername = input.username || input.email.split('@')[0];
    const [created] = await db.insert(users)
      .values({
        uid: input.uid,
        email: input.email,
        name: input.name || defaultUsername,
        username: defaultUsername,
        avatar: input.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(input.uid)}`,
        gamerTag: input.gamerTag || `${defaultUsername.toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`,
        favoritePlatform: input.favoritePlatform || 'PlayStation 5',
      })
      .returning();

    return created;
  } catch (error) {
    console.error('getOrCreateUser failed:', error);
    throw new Error('Database operation failed for user.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const res = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('getUserByUid failed:', error);
    throw new Error('Failed to fetch user.', { cause: error });
  }
}
