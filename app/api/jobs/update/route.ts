import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();
    const { id, ...data } = await request.json();

    await db.update(jobs)
      .set({
        ...data,
        updated_at: new Date().toISOString()
      })
      .where(and(
          eq(jobs.id, id),
          eq(jobs.user_id, userId)
      ));

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
