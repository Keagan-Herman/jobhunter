import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId, content } = await request.json()
    if (!jobId || !content) {
      return NextResponse.json({ error: 'jobId and content are required' }, { status: 400 })
    }

    // Update the latest cover letter for this job
    const { data: latest } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest) {
      const { error } = await supabase
        .from('cover_letters')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', latest.id)

      if (error) throw error
    } else {
      // If none exists, create one
      const { error } = await supabase
        .from('cover_letters')
        .insert({
          job_id: jobId,
          user_id: user.id,
          content,
          version: 1
        })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
