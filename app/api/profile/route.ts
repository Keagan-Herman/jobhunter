import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server'
import { ensureLocalUser } from '@/lib/db/user';

export async function GET() {
  try {
    const userId = await ensureLocalUser();
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId)
    });
    return NextResponse.json({ profile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await ensureLocalUser();
    const data = await request.json();

    await db.update(profiles)
      .set({
        ...data,
        updated_at: new Date().toISOString()
      })
      .where(eq(profiles.id, userId));

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
