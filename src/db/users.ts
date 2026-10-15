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

export interface DbUserRecord {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  gamerTag: string | null;
  favoritePlatform: string | null;
  createdAt?: Date | null;
}

// In-memory fallback user store
const inMemoryUsers = new Map<string, DbUserRecord>();
let nextUserId = 1;

export async function getOrCreateUser(input: UserInput): Promise<DbUserRecord> {
  if (db) {
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
      console.warn('[AI Studio] PostgreSQL user query failed, using in-memory store:', error);
    }
  }

  // In-memory fallback
  const existingUser = inMemoryUsers.get(input.uid);
  if (existingUser) {
    if (input.name) existingUser.name = input.name;
    if (input.avatar) existingUser.avatar = input.avatar;
    if (input.gamerTag) existingUser.gamerTag = input.gamerTag;
    if (input.favoritePlatform) existingUser.favoritePlatform = input.favoritePlatform;
    return existingUser;
  }

  const defaultUsername = input.username || input.email.split('@')[0];
  const newUser: DbUserRecord = {
    id: nextUserId++,
    uid: input.uid,
    email: input.email,
    name: input.name || defaultUsername,
    username: defaultUsername,
    avatar: input.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(input.uid)}`,
    gamerTag: input.gamerTag || `${defaultUsername.toUpperCase()}#${Math.floor(1000 + Math.random() * 9000)}`,
    favoritePlatform: input.favoritePlatform || 'PlayStation 5',
    createdAt: new Date(),
  };

  inMemoryUsers.set(input.uid, newUser);
  return newUser;
}

export async function getUserByUid(uid: string): Promise<DbUserRecord | null> {
  if (db) {
    try {
      const res = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      return res[0] || null;
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL getUserByUid failed, using in-memory store:', error);
    }
  }
  return inMemoryUsers.get(uid) || null;
}

