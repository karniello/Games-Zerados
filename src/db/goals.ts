import { db } from './index.ts';
import { yearlyGoals } from './schema.ts';
import { and, eq } from 'drizzle-orm';
import type { YearlyGoal } from '../types.ts';

// In-memory fallback goals store per user and year
const inMemoryGoals = new Map<string, YearlyGoal>();

export async function getGoalByDbUserIdAndYear(
  userId: number,
  year: number
): Promise<YearlyGoal> {
  if (db) {
    try {
      const res = await db
        .select()
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, year)))
        .limit(1);

      if (res.length > 0) {
        const row = res[0];
        let parsedBacklog: any[] = [];
        if (row.backlog) {
          try {
            parsedBacklog = JSON.parse(row.backlog);
          } catch {}
        }
        return {
          year: row.year,
          targetGames: row.targetGames,
          targetHours: row.targetHours ?? 200,
          notes: row.notes ?? '',
          backlog: parsedBacklog,
        };
      }
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL getGoal query failed, using in-memory store:', error);
    }
  }

  const key = `${userId}_${year}`;
  if (inMemoryGoals.has(key)) {
    return inMemoryGoals.get(key)!;
  }

  return {
    year,
    targetGames: 12,
    targetHours: 200,
    notes: 'Meta anual de zeramentos para manter o ritmo gamer!',
    backlog: [],
  };
}

export async function saveGoalForDbUser(
  userId: number,
  goal: YearlyGoal
): Promise<YearlyGoal> {
  const key = `${userId}_${goal.year}`;

  if (db) {
    try {
      const backlogStr = goal.backlog ? JSON.stringify(goal.backlog) : '[]';
      const existing = await db
        .select({ id: yearlyGoals.id })
        .from(yearlyGoals)
        .where(and(eq(yearlyGoals.userId, userId), eq(yearlyGoals.year, goal.year)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(yearlyGoals)
          .set({
            targetGames: goal.targetGames,
            targetHours: goal.targetHours ?? 200,
            notes: goal.notes ?? null,
            backlog: backlogStr,
            updatedAt: new Date(),
          })
          .where(eq(yearlyGoals.id, existing[0].id));
      } else {
        await db.insert(yearlyGoals).values({
          userId,
          year: goal.year,
          targetGames: goal.targetGames,
          targetHours: goal.targetHours ?? 200,
          notes: goal.notes ?? null,
          backlog: backlogStr,
          updatedAt: new Date(),
        });
      }

      return goal;
    } catch (error) {
      console.warn('[AI Studio] PostgreSQL saveGoal query failed, using in-memory store:', error);
    }
  }

  inMemoryGoals.set(key, goal);
  return goal;
}

