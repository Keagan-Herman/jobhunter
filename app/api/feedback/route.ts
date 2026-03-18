import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId, action, reason } = await request.json()

    // Save feedback
    await supabase.from('job_feedback').insert({
      user_id: user.id,
      job_id: jobId,
      action,
      reason: reason || null
    })

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: action === 'skipped' ? 'skipped' : 'applied' })
      .eq('id', jobId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get last 20 feedback entries to build AI context
    const { data: feedback } = await supabase
      .from('job_feedback')
      .select(`
        action,
        reason,
        jobs (
          title,
          company,
          stack,
          score
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ feedback })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}