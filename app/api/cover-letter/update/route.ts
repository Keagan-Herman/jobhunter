import { db } from '@/lib/db';
import { coverLetters } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();
    const { jobId, content } = await request.json();

    if (!jobId || content === undefined) {
      return NextResponse.json({ error: 'jobId and content are required' }, { status: 400 });
    }

    const latestLetter = await db.query.coverLetters.findFirst({
      where: and(
        eq(coverLetters.job_id, jobId),
        eq(coverLetters.user_id, userId)
      ),
      orderBy: [desc(coverLetters.version)],
    });

    if (!latestLetter) {
      return NextResponse.json({ error: 'No cover letter found for this job' }, { status: 404 });
    }

    await db.update(coverLetters)
      .set({ content, user_id: userId })
      .where(eq(coverLetters.id, latestLetter.id));

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
