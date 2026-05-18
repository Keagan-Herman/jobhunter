import { SupabaseClient } from '@supabase/supabase-js'

export const scoreCache = {
  async get(supabase: SupabaseClient, key: string) {
    const { data } = await supabase
      .from('jobs')
      .select('score, score_reason, stack, score_is_fallback')
      .eq('external_id', key.split('_')[0])
      .eq('user_id', key.split('_')[1])
      .eq('score_is_fallback', false)
      .single()

    if (data) {
        return {
            score: data.score,
            reason: data.score_reason,
            stack: data.stack,
            score_is_fallback: data.score_is_fallback
        }
    }
    return null
  },

  async set() {
    // In our case, the score is already being saved to the jobs table during the scan loop.
    // So 'set' is implicitly handled by the insert.
    // However, if we wanted a separate cache table:
    /*
    await supabase.from('score_cache').upsert({
      key,
      value,
      expires_at: new Date(Date.now() + 86400 * 1000).toISOString()
    })
    */
  }
}
