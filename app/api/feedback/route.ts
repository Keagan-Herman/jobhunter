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
    const status = action === 'skipped' ? 'skipped' :
                   action === 'pending' ? 'pending' : 'applied'

    await supabase
      .from('jobs')
      .update({
        status,
        score_reason: action === 'skipped' && reason ? `Skipped: ${reason}` : undefined
      })
      .eq('id', jobId)

    // Extract signals if skipped
    if (action === 'skipped' && reason) {
        const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
        if (job) {
            // Add to learned_signals with negative outcome
            const signalType = reason.toLowerCase().includes('stack') ? 'stack' :
                               reason.toLowerCase().includes('senior') ? 'seniority' :
                               reason.toLowerCase().includes('salary') ? 'salary' : 'preference'

            await supabase.from('learned_signals').insert({
                user_id: user.id,
                signal_type: signalType,
                signal_value: reason,
                weight: 0.5,
                outcome: 'negative'
            })
        }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}