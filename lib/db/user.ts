import { db, initDb } from './index';
import { profiles } from './schema';
import { eq } from 'drizzle-orm';

export const LOCAL_USER_ID = 'local-user';

export async function ensureLocalUser() {
  // Ensure tables exist before querying
  initDb();

  try {
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.id, LOCAL_USER_ID)
    });

    if (!existing) {
      await db.insert(profiles).values({
        id: LOCAL_USER_ID,
        email: 'local@user.com',
        full_name: 'Local User',
        job_title: '',
        skills: [],
        search_terms: []
      });
    }
  } catch (err) {
    // If table doesn't exist yet even after initDb (rare race condition)
    // We can try to catch and re-run initDb or just log
    console.error('Error ensuring local user:', err);
    throw err;
  }

  return LOCAL_USER_ID;
}
