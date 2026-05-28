import { db } from '@/lib/db';
import { jobs, coverLetters } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';

export async function GET() {
  try {
    const userId = await ensureLocalUser();

    const allJobs = await db.query.jobs.findMany({
      where: eq(jobs.user_id, userId),
      orderBy: [desc(jobs.score)],
      with: {
        coverLetters: {
            orderBy: [desc(coverLetters.version)],
            limit: 1
        }
      }
    });

    const formattedJobs = allJobs.map(j => ({
        ...j,
        cover_letter: j.coverLetters?.[0]?.content,
        cover_letter_id: j.coverLetters?.[0]?.id
    }));

    return NextResponse.json({ jobs: formattedJobs })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
