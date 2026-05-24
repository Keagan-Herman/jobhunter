import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: Request) {
  try {
    // ✅ Support both header and query param for Vercel crons
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const authHeader = request.headers.get('authorization')
    const url = new URL(request.url)
    const querySecret = url.searchParams.get('secret')

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      querySecret === process.env.CRON_SECRET

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all users with notifications enabled who have an email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, email_notifications, last_notified_at')
      .eq('email_notifications', true)
      .not('email', 'is', null)

    if (!profiles?.length) {
      return NextResponse.json({ message: 'No users to notify' })
    }

    let notified = 0
    let errors = 0

    for (const profile of profiles) {
      try {
        if (!profile.email) continue

        // ✅ Only get jobs added since last notification
        const since = profile.last_notified_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data: newJobs } = await supabase
          .from('jobs')
          .select('id, title, company, score, location')
          .eq('user_id', profile.id)
          .eq('status', 'pending')
          .gte('score', 75)
          .gte('fetched_at', since) // ✅ only new jobs since last run
          .order('score', { ascending: false })
          .limit(5)

        if (!newJobs?.length) continue

        // ✅ Send via Resend
        await resend.emails.send({
          from: 'JobHunter <notifications@yourdomain.com>',
          to: profile.email,
          subject: `${newJobs.length} new job${newJobs.length > 1 ? 's' : ''} matched your profile`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #080812; color: #e0e0f0;">
              <h1 style="color: #fff; font-size: 24px; margin-bottom: 4px;">
                Job<span style="color: #00ff87;">Hunter</span>
              </h1>
              <p style="color: #555; font-size: 13px; margin-bottom: 24px;">Your daily job digest</p>

              <p style="color: #aaa; margin-bottom: 16px;">
                Hey ${profile.full_name?.split(' ')[0] || 'there'} — we found
                <strong style="color: #00ff87;">${newJobs.length} new job${newJobs.length > 1 ? 's' : ''}</strong> 
                matching your profile today.
              </p>

              <div style="background: #0d0d20; border: 1px solid #1e1e38; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                ${newJobs.map(j => `
                  <div style="padding: 10px 0; border-bottom: 1px solid #1a1a32;">
                    <div style="font-weight: 600; color: #fff; font-size: 14px;">${j.title}</div>
                    <div style="color: #555; font-size: 12px; margin-top: 2px;">${j.company} - ${j.location}</div>
                    <div style="color: #00ff87; font-size: 12px; margin-top: 4px; font-family: monospace;">${j.score}% match</div>
                  </div>
                `).join('')}
              </div>

              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
                style="display: block; background: #00ff87; color: #0a0a1a; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 1px;">
                VIEW JOBS & APPLY
              </a>

              <p style="color: #333; font-size: 11px; text-align: center; margin-top: 20px; font-family: monospace;">
                You're receiving this because you have notifications enabled.<br/>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile" style="color: #444;">Manage preferences</a>
              </p>
            </div>
          `
        })

        // ✅ Update last notified timestamp
        await supabase
          .from('profiles')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('id', profile.id)

        notified++

      } catch (userErr: unknown) {
        // ✅ Per-user error handling — one failure doesn't kill the rest
        const message = userErr instanceof Error ? userErr.message : String(userErr)
        console.log(`[NOTIFY] Failed for ${profile.email}: ${message}`)
        errors++
      }
    }

    return NextResponse.json({ success: true, notified, errors })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}