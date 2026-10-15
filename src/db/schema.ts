import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  username: text('username'),
  avatar: text('avatar'),
  gamerTag: text('gamer_tag'),
  favoritePlatform: text('favorite_platform'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const games = pgTable('games', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  thumbnail: text('thumbnail').notNull(),
  platform: text('platform').notNull(),
  genre: text('genre').notNull(),
  completionCondition: text('completion_condition').notNull(),
  rating: real('rating').notNull(),
  difficulty: text('difficulty').notNull(),
  hours: real('hours').notNull(),
  completedDate: text('completed_date').notNull(), // YYYY-MM-DD
  releaseYear: integer('release_year'),
  developer: text('developer'),
  publisher: text('publisher'),
  synopsis: text('synopsis'),
  notes: text('notes'),
  favorite: boolean('favorite').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const yearlyGoals = pgTable('yearly_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  year: integer('year').notNull(),
  targetGames: integer('target_games').notNull().default(12),
  targetHours: real('target_hours').default(200),
  notes: text('notes'),
  backlog: text('backlog'), // JSON stringified BacklogItem[]
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  games: many(games),
  yearlyGoals: many(yearlyGoals),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
  }),
}));

export const yearlyGoalsRelations = relations(yearlyGoals, ({ one }) => ({
  user: one(users, {
    fields: [yearlyGoals.userId],
    references: [users.id],
  }),
}));
