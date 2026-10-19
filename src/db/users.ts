import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, role?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || null,
        role: role || 'CUSTOMER',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(role ? { role } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to getOrCreateUser in PostgreSQL:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}

export async function getUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database getUsers failed:', error);
    throw new Error('Failed to retrieve users from database.', { cause: error });
  }
}
